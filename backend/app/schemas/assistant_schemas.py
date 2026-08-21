from typing import Any, Optional, List, Dict
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


class VoiceGuideRequest(BaseModel):
    user_message: str
    language: str = "hi"  # "hi" or "en"
    current_screen: str = "welcome"
    agent_stage: Optional[str] = "GREETING"
    active_form_id: Optional[str] = None
    active_field_id: Optional[str] = None
    profile_data: Optional[Dict[str, Any]] = None
    form_fields: Optional[List[Dict[str, Any]]] = None
    conversation_history: Optional[List[Dict[str, str]]] = None
    synthesize_audio: bool = True


class VoiceGuideResponse(BaseModel):
    spoken_text_en: str
    spoken_text_hi: str
    action_type: str = "SPEAK"  # "NAVIGATE", "SELECT_FORM", "SELECT_FIELD", "UPDATE_FIELD", "ASK_MISSING_FIELD", "SPEAK"
    agent_stage: str = "GREETING"
    target_screen: Optional[str] = None
    target_form_id: Optional[str] = None
    target_field_id: Optional[str] = None
    extracted_field_update: Optional[Dict[str, Any]] = None
    missing_fields_remaining: List[str] = Field(default_factory=list)
    suggested_quick_replies_en: List[str] = Field(default_factory=list)
    suggested_quick_replies_hi: List[str] = Field(default_factory=list)
    audio_base64: Optional[str] = None
    audio_format: Optional[str] = "pcm_24khz"
