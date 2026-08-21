from typing import Any, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.profile_schemas import CitizenProfile


class FormFieldGuidance(BaseModel):
    field_id: str
    label_en: str
    label_hi: str
    explanation_en: str
    explanation_hi: str
    field_type: str = "text"  # text | date | number | select | checkbox
    is_required: bool = True
    proposed_value: Optional[Any] = None
    value_source: str = "needed"  # document_confirmed | user_confirmed | default | needed
    source_description_en: Optional[str] = None
    source_description_hi: Optional[str] = None
    confidence: Optional[float] = None
    completion_state: str = "ready"  # ready | needs_attention | missing
    manual_instruction_en: str = Field(description="Exact 'Write this in the form' guidance")
    manual_instruction_hi: str = Field(description="Exact 'फॉर्म में यह लिखें' guidance")
    validation_regex: Optional[str] = None


class FormTemplate(BaseModel):
    id: str
    name_en: str
    name_hi: str
    category: str
    form_type: str = "manual"  # manual | fillable_pdf
    pdf_filename: Optional[str] = None
    description_en: str
    description_hi: str
    fields: list[dict[str, Any]]
    supported_fillable: bool = False


class FormReadinessRequest(BaseModel):
    form_id: str
    profile: CitizenProfile
    language: str = "en"


class FormReadinessResponse(BaseModel):
    form_id: str
    form_name_en: str
    form_name_hi: str
    form_type: str
    total_fields: int
    completed_fields: int
    missing_fields_count: int
    field_guidance_list: list[FormFieldGuidance]
    checklist_en: list[str]
    checklist_hi: list[str]
    can_generate_pdf_draft: bool = False
    draft_download_url: Optional[str] = None
    disclaimer: str = (
        "Guidance only: Verify all values before final submission. "
        "Generated draft PDFs must be reviewed manually."
    )
