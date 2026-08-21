import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from backend.app.schemas.profile_schemas import CitizenProfile
from backend.app.schemas.eligibility_schemas import (
    CriterionEvaluation,
    EligibilityEvaluationResponse,
    SchemeRule,
)
from backend.app.services.ai.groq import groq_service

logger = logging.getLogger(__name__)

RULES_FILE = Path(__file__).resolve().parent.parent.parent / "app" / "rules" / "schemes.json"


class EligibilityCopilotService:
    """
    Module 2: Eligibility Copilot
    Evaluates a confirmed citizen profile against versioned rules and provides transparent guidance.
    """

    def __init__(self):
        self._schemes_cache: Optional[List[Dict[str, Any]]] = None

    def load_schemes(self) -> List[Dict[str, Any]]:
        """Load schemes from the versioned JSON rule file."""
        if self._schemes_cache is None:
            if RULES_FILE.exists():
                with open(RULES_FILE, "r", encoding="utf-8") as f:
                    self._schemes_cache = json.load(f)
            else:
                self._schemes_cache = []
        return self._schemes_cache

    def get_scheme_by_id(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        schemes = self.load_schemes()
        for s in schemes:
            if s["id"] == scheme_id:
                return s
        return None

    def _extract_profile_value(self, profile: CitizenProfile, field_key: str) -> Optional[Any]:
        """Safely extract a value from CitizenProfile, with computed fallbacks (like age from DOB)."""
        field_attr = getattr(profile, field_key, None)
        if field_attr is not None and field_attr.value is not None:
            return field_attr.value

        # Custom fields check
        if field_key in profile.custom_fields and profile.custom_fields[field_key].value is not None:
            return profile.custom_fields[field_key].value

        # Compute age from date_of_birth if age is missing
        if field_key == "age" and profile.date_of_birth and profile.date_of_birth.value:
            dob_str = str(profile.date_of_birth.value).strip()
            for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
                try:
                    dob_dt = datetime.strptime(dob_str, fmt)
                    now = datetime.now()
                    age = now.year - dob_dt.year - ((now.month, now.day) < (dob_dt.month, dob_dt.day))
                    return age
                except ValueError:
                    continue

        return None

    def evaluate(
        self,
        scheme_id: str,
        profile: CitizenProfile,
        available_document_types: List[str],
        language: str = "en",
    ) -> EligibilityEvaluationResponse:
        """
        Evaluate citizen profile deterministically against scheme rules.
        """
        scheme = self.get_scheme_by_id(scheme_id)
        if not scheme:
            raise ValueError(f"Scheme with ID '{scheme_id}' was not found.")

        criteria_evals: List[CriterionEvaluation] = []
        missing_fields: List[Dict[str, str]] = []
        has_not_met = False
        has_needs_info = False

        for crit in scheme.get("criteria", []):
            crit_id = crit["id"]
            field_key = crit["field_key"]
            label_en = crit["label_en"]
            label_hi = crit["label_hi"]
            rule_type = crit["rule_type"]
            citation = crit.get("citation", scheme["official_source_url"])

            actual_val = self._extract_profile_value(profile, field_key)

            if actual_val is None or str(actual_val).strip() == "":
                has_needs_info = True
                missing_fields.append({"field_key": field_key, "label_en": label_en, "label_hi": label_hi})
                criteria_evals.append(
                    CriterionEvaluation(
                        criterion_id=crit_id,
                        label_en=label_en,
                        label_hi=label_hi,
                        status="needs_information",
                        reason_en=f"Information for '{label_en}' is required to evaluate this condition.",
                        reason_hi=f"इस शर्त की जांच के लिए '{label_hi}' की जानकारी आवश्यक है।",
                        rule_source_citation=citation,
                        actual_value=None,
                    )
                )
                continue

            # Evaluate rules deterministically
            status = "met"
            reason_en = ""
            reason_hi = ""

            try:
                if rule_type == "min_value":
                    num_val = float(actual_val)
                    threshold = float(crit["threshold"])
                    if num_val >= threshold:
                        status = "met"
                        reason_en = f"Value ({num_val}) meets the minimum requirement of {threshold}."
                        reason_hi = f"दर्ज मान ({num_val}) न्यूनतम आवश्यकता ({threshold}) को पूरा करता है।"
                    else:
                        status = "not_met"
                        has_not_met = True
                        reason_en = f"Value ({num_val}) is below the required minimum of {threshold}."
                        reason_hi = f"दर्ज मान ({num_val}) न्यूनतम सीमा ({threshold}) से कम है।"

                elif rule_type == "max_value":
                    num_val = float(actual_val)
                    threshold = float(crit["threshold"])
                    if num_val <= threshold:
                        status = "met"
                        reason_en = f"Value ({num_val}) is within the allowable limit of {threshold}."
                        reason_hi = f"दर्ज मान ({num_val}) अनुमत अधिकतम सीमा ({threshold}) के भीतर है।"
                    else:
                        status = "not_met"
                        has_not_met = True
                        reason_en = f"Value ({num_val}) exceeds the maximum allowable limit of {threshold}."
                        reason_hi = f"दर्ज मान ({num_val}) अधिकतम सीमा ({threshold}) से अधिक है।"

                elif rule_type == "range":
                    num_val = float(actual_val)
                    min_val = float(crit["min_value"])
                    max_val = float(crit["max_value"])
                    if min_val <= num_val <= max_val:
                        status = "met"
                        reason_en = f"Value ({num_val}) falls within the required range ({min_val} to {max_val})."
                        reason_hi = f"दर्ज मान ({num_val}) आवश्यक सीमा ({min_val} से {max_val}) के भीतर है।"
                    else:
                        status = "not_met"
                        has_not_met = True
                        reason_en = f"Value ({num_val}) is outside the required range ({min_val} to {max_val})."
                        reason_hi = f"दर्ज मान ({num_val}) आवश्यक सीमा ({min_val} से {max_val}) से बाहर है।"

                elif rule_type == "not_empty":
                    if bool(actual_val):
                        status = "met"
                        reason_en = f"Valid value '{actual_val}' is confirmed."
                        reason_hi = f"मान '{actual_val}' सफलतापूर्वक सत्यापित है।"
                    else:
                        status = "not_met"
                        has_not_met = True
                        reason_en = "Field cannot be empty."
                        reason_hi = "यह फ़ील्ड रिक्त नहीं हो सकता।"

            except (ValueError, TypeError) as e:
                status = "needs_information"
                has_needs_info = True
                reason_en = f"Value '{actual_val}' could not be evaluated numerically."
                reason_hi = f"मान '{actual_val}' की संख्यात्मक रूप से जांच नहीं की जा सकी।"

            criteria_evals.append(
                CriterionEvaluation(
                    criterion_id=crit_id,
                    label_en=label_en,
                    label_hi=label_hi,
                    status=status,
                    reason_en=reason_en,
                    reason_hi=reason_hi,
                    rule_source_citation=citation,
                    actual_value=actual_val,
                )
            )

        # Check required documents
        missing_documents: List[Dict[str, str]] = []
        for req_doc in scheme.get("required_documents", []):
            doc_type = req_doc["doc_type"]
            if doc_type not in available_document_types:
                missing_documents.append(
                    {
                        "doc_type": doc_type,
                        "name_en": req_doc["name_en"],
                        "name_hi": req_doc["name_hi"],
                        "reason_en": req_doc.get("reason_en", ""),
                        "reason_hi": req_doc.get("reason_hi", ""),
                    }
                )

        # Final status decision
        if has_not_met:
            overall_status = "not_a_match"
        elif has_needs_info or len(missing_documents) > 0:
            overall_status = "needs_information"
        else:
            overall_status = "likely_match"

        # Generate summary explanations and next actions
        summary_en, summary_hi, next_actions_en, next_actions_hi = self._generate_guidance_text(
            scheme=scheme,
            overall_status=overall_status,
            missing_fields=missing_fields,
            missing_documents=missing_documents,
            criteria_evals=criteria_evals,
        )

        return EligibilityEvaluationResponse(
            scheme_id=scheme["id"],
            scheme_name=scheme["name_en"] if language == "en" else scheme["name_hi"],
            status=overall_status,
            summary_explanation_en=summary_en,
            summary_explanation_hi=summary_hi,
            criteria_evaluations=criteria_evals,
            missing_fields=missing_fields,
            missing_documents=missing_documents,
            next_actions_en=next_actions_en,
            next_actions_hi=next_actions_hi,
            official_source_url=scheme["official_source_url"],
        )

    def _generate_guidance_text(
        self,
        scheme: Dict[str, Any],
        overall_status: str,
        missing_fields: List[Dict[str, str]],
        missing_documents: List[Dict[str, str]],
        criteria_evals: List[CriterionEvaluation],
    ) -> tuple[str, str, List[str], List[str]]:
        """Generate friendly bilingual explanations and next actions."""
        scheme_name_en = scheme["name_en"]
        scheme_name_hi = scheme["name_hi"]

        if overall_status == "likely_match":
            summary_en = (
                f"Based on the confirmed information provided, you appear to meet the primary criteria for {scheme_name_en}. "
                "All required eligibility conditions and documents are in place."
            )
            summary_hi = (
                f"प्रदान की गई सत्यापित जानकारी के आधार पर, आप {scheme_name_hi} के मुख्य पात्रता मानदंडों को पूरा करते प्रतीत होते हैं। "
                "सभी आवश्यक शर्तें और दस्तावेज़ उपलब्ध हैं।"
            )
            next_actions_en = [
                "Proceed to Form Preparation to generate your field-by-field completion plan.",
                "Review the official portal guidelines before final submission.",
            ]
            next_actions_hi = [
                "फ़ॉर्म भरने की तैयारी शुरू करें और फ़ील्ड-वार मार्गदर्शन प्राप्त करें।",
                "अंतिम जमा करने से पहले आधिकारिक पोर्टल के दिशा-निर्देशों की समीक्षा करें।",
            ]

        elif overall_status == "not_a_match":
            unmet_reasons_en = [c.label_en for c in criteria_evals if c.status == "not_met"]
            unmet_reasons_hi = [c.label_hi for c in criteria_evals if c.status == "not_met"]
            summary_en = (
                f"Based on the provided information, you do not appear to meet the criteria for {scheme_name_en}. "
                f"Condition(s) not met: {', '.join(unmet_reasons_en)}."
            )
            summary_hi = (
                f"प्रदान की गई जानकारी के आधार पर, आप {scheme_name_hi} के मानदंडों को पूरा नहीं करते हैं। "
                f"अपात्र शर्त(ें): {', '.join(unmet_reasons_hi)}।"
            )
            next_actions_en = [
                "Double-check the entered values in your profile if any information was entered incorrectly.",
                "Explore other related schemes that may match your profile.",
            ]
            next_actions_hi = [
                "यदि कोई जानकारी गलत दर्ज हो गई हो, तो अपने प्रोफ़ाइल में विवरण की दोबारा जांच करें।",
                "अपनी प्रोफ़ाइल के अनुरूप अन्य संबंधित सरकारी योजनाओं की खोज करें।",
            ]

        else:  # needs_information
            needed_items_en = [f["label_en"] for f in missing_fields] + [d["name_en"] for d in missing_documents]
            needed_items_hi = [f["label_hi"] for f in missing_fields] + [d["name_hi"] for d in missing_documents]
            summary_en = (
                f"Additional details are needed to complete the eligibility check for {scheme_name_en}. "
                f"Pending item(s): {', '.join(needed_items_en)}."
            )
            summary_hi = (
                f"{scheme_name_hi} के लिए पात्रता की पूर्ण जांच करने हेतु अतिरिक्त जानकारी आवश्यक है। "
                f"लंबित विवरण: {', '.join(needed_items_hi)}।"
            )
            next_actions_en = [
                "Enter the missing profile facts or upload the required supporting document(s).",
                "Verify your details once extracted to re-evaluate eligibility.",
            ]
            next_actions_hi = [
                "अपेक्षित विवरण दर्ज करें या आवश्यक दस्तावेज़ अपलोड करें।",
                "जानकारी दर्ज होने के बाद पात्रता का पुनः मूल्यांकन करें।",
            ]

        return summary_en, summary_hi, next_actions_en, next_actions_hi


eligibility_copilot_service = EligibilityCopilotService()
