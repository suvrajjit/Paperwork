from typing import Any, Optional
from pydantic import BaseModel, Field


class ExtractedField(BaseModel):
    field_key: str
    label_en: str
    label_hi: str
    value: Any
    masked_value: Optional[str] = None
    source_text: str = Field(description="Exact snippet from OCR text supporting this extraction")
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)
    category: str = Field(default="general", description="identity | address | income | general")
    is_sensitive: bool = False
    bounding_box: Optional[list[float]] = None


class DocumentExtractionRequest(BaseModel):
    document_type_hint: Optional[str] = None
    language_hint: Optional[str] = "en"


class DocumentExtractionResponse(BaseModel):
    document_id: str
    detected_document_type: str
    raw_ocr_text: str
    fields: list[ExtractedField]
    quality_flags: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    requires_user_confirmation: bool = True
    disclaimer: str = (
        "Guidance only: Extracted details must be verified and confirmed by the user before use. "
        "The application does not assess legal authenticity."
    )
