import json
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from backend.app.schemas.profile_schemas import CitizenProfile
from backend.app.schemas.form_schemas import (
    FormFieldGuidance,
    FormReadinessResponse,
    FormTemplate,
)
from backend.app.services.documents.pdf_generator import pdf_draft_generator

logger = logging.getLogger(__name__)

RULES_FILE = Path(__file__).resolve().parent.parent.parent / "app" / "rules" / "sample_forms.json"


class FormReadinessService:
    """
    Module 3: Form Readiness Kit
    Converts a form template and confirmed citizen profile into a field-by-field completion plan.
    Provides manual 'write this here' guidance or generates a downloadable draft PDF.
    """

    def __init__(self):
        self._forms_cache: Optional[List[Dict[str, Any]]] = None

    def load_form_templates(self) -> List[Dict[str, Any]]:
        """Load form schemas from sample_forms.json."""
        if self._forms_cache is None:
            if RULES_FILE.exists():
                with open(RULES_FILE, "r", encoding="utf-8") as f:
                    self._forms_cache = json.load(f)
            else:
                self._forms_cache = []
        return self._forms_cache

    def get_form_by_id(self, form_id: str) -> Optional[Dict[str, Any]]:
        forms = self.load_form_templates()
        for f in forms:
            if f["id"] == form_id:
                return f
        return None

    def _extract_profile_value(
        self, profile: CitizenProfile, field_key: str
    ) -> tuple[Optional[Any], str, Optional[str], Optional[float]]:
        """
        Extract field value from CitizenProfile along with value source and confidence.
        Returns (value, value_source, source_description, confidence)
        """
        field_attr = getattr(profile, field_key, None)
        if field_attr is not None and field_attr.value is not None:
            val = field_attr.value
            source = field_attr.source or "profile"
            conf = field_attr.confidence or 0.95
            desc_en = f"From confirmed profile ({field_key})"
            desc_hi = f"सत्यापित प्रोफ़ाइल से ({field_key})"
            return val, "document_confirmed", desc_en, conf

        # Custom fields check
        if field_key in profile.custom_fields and profile.custom_fields[field_key].value is not None:
            f_obj = profile.custom_fields[field_key]
            return f_obj.value, "document_confirmed", "From confirmed document", f_obj.confidence or 0.90

        return None, "needed", None, None

    def prepare_form_plan(
        self,
        form_id: str,
        profile: CitizenProfile,
        language: str = "en",
    ) -> FormReadinessResponse:
        """
        Generate sequential field-by-field guidance and readiness response.
        """
        form = self.get_form_by_id(form_id)
        if not form:
            raise ValueError(f"Form with ID '{form_id}' was not found.")

        field_guidance_list: List[FormFieldGuidance] = []
        completed_count = 0
        missing_count = 0

        for f_def in form.get("fields", []):
            field_id = f_def["field_id"]
            mapping_key = f_def.get("profile_mapping", field_id)
            label_en = f_def["label_en"]
            label_hi = f_def["label_hi"]
            exp_en = f_def.get("explanation_en", "")
            exp_hi = f_def.get("explanation_hi", "")
            field_type = f_def.get("field_type", "text")
            is_required = f_def.get("is_required", True)

            prop_val, val_src, src_desc, conf = self._extract_profile_value(profile, mapping_key)

            if prop_val is not None and str(prop_val).strip() != "":
                completed_count += 1
                completion_state = "ready"
                manual_en = f"Write '{prop_val}' clearly in this box/line."
                manual_hi = f"इस बॉक्स/पंक्ति में स्पष्ट रूप से '{prop_val}' लिखें।"
                src_desc_en = src_desc or "From confirmed document"
                src_desc_hi = "सत्यापित दस्तावेज़ से"
            else:
                missing_count += 1
                completion_state = "missing" if is_required else "needs_attention"
                prop_val = None
                val_src = "needed"
                manual_en = f"Please fill your {label_en} manually or upload a supporting document."
                manual_hi = f"कृपया अपना {label_hi} स्वयं भरें अथवा सहायक दस्तावेज़ अपलोड करें।"
                src_desc_en = "Still needed"
                src_desc_hi = "जानकारी अपेक्षित है"

            field_guidance_list.append(
                FormFieldGuidance(
                    field_id=field_id,
                    label_en=label_en,
                    label_hi=label_hi,
                    explanation_en=exp_en,
                    explanation_hi=exp_hi,
                    field_type=field_type,
                    is_required=is_required,
                    proposed_value=prop_val,
                    value_source=val_src,
                    source_description_en=src_desc_en,
                    source_description_hi=src_desc_hi,
                    confidence=conf,
                    completion_state=completion_state,
                    manual_instruction_en=manual_en,
                    manual_instruction_hi=manual_hi,
                    validation_regex=f_def.get("validation_regex"),
                )
            )

        total_fields = len(field_guidance_list)

        return FormReadinessResponse(
            form_id=form["id"],
            form_name_en=form["name_en"],
            form_name_hi=form["name_hi"],
            form_type=form.get("form_type", "manual"),
            total_fields=total_fields,
            completed_fields=completed_count,
            missing_fields_count=missing_count,
            field_guidance_list=field_guidance_list,
            checklist_en=form.get("checklist_en", []),
            checklist_hi=form.get("checklist_hi", []),
            can_generate_pdf_draft=form.get("supported_fillable", True),
            draft_download_url=f"/v1/forms/{form['id']}/draft-pdf",
        )

    def generate_pdf_draft_bytes(
        self,
        form_id: str,
        profile: CitizenProfile,
        language: str = "en",
    ) -> bytes:
        """
        Generate raw PDF draft bytes with banner and sequential prefilled fields.
        """
        plan = self.prepare_form_plan(form_id, profile, language)
        fields_payload = [
            {
                "field_id": f.field_id,
                "label_en": f.label_en if language == "en" else f.label_hi,
                "proposed_value": f.proposed_value,
                "source_description_en": f.source_description_en if language == "en" else f.source_description_hi,
                "value_source": f.value_source,
            }
            for f in plan.field_guidance_list
        ]
        checklist = plan.checklist_en if language == "en" else plan.checklist_hi
        form_name = plan.form_name_en if language == "en" else plan.form_name_hi

        return pdf_draft_generator.generate_form_draft(
            form_name=form_name,
            form_id=form_id,
            fields=fields_payload,
            checklist=checklist,
        )


form_readiness_service = FormReadinessService()
