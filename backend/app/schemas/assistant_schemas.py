from typing import Any, Optional
from pydantic import BaseModel, Field


class AssistantMessageRequest(BaseModel):
    user_message: str
    language: str = "en"  # "en" or "hi"
    current_context: Optional[str] = None  # e.g., "form_workspace", "eligibility", "document_review"
    active_field_id: Optional[str] = None
    form_id: Optional[str] = None
    scheme_id: Optional[str] = None
    context_data: Optional[dict[str, Any]] = None


class AssistantMessageResponse(BaseModel):
    response_text_en: str
    response_text_hi: str
    suggested_action: Optional[str] = None
    audio_base64: Optional[str] = None
    audio_format: Optional[str] = "mp3"


class ExplainRequest(BaseModel):
    text: str
    context: Optional[str] = None
    target_language: str = "hi"


class ExplainResponse(BaseModel):
    original_text: str
    simplified_en: str
    simplified_hi: str
    key_takeaways_en: list[str] = Field(default_factory=list)
    key_takeaways_hi: list[str] = Field(default_factory=list)
    official_source_citation: Optional[str] = None
