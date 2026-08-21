from typing import Any, Optional
from pydantic import BaseModel, Field


class ProfileFieldValue(BaseModel):
    value: Any
    source: str = Field(
        default="user_input",
        description="Source of the value: e.g., 'document_ocr', 'user_input', 'vault'",
    )
    source_document_id: Optional[str] = None
    confidence: Optional[float] = Field(default=1.0, ge=0.0, le=1.0)
    confirmed_by_user: bool = Field(default=False)
    masked_value: Optional[str] = None


class CitizenProfile(BaseModel):
    full_name: Optional[ProfileFieldValue] = None
    date_of_birth: Optional[ProfileFieldValue] = None
    age: Optional[ProfileFieldValue] = None
    gender: Optional[ProfileFieldValue] = None
    father_or_spouse_name: Optional[ProfileFieldValue] = None
    aadhaar_number: Optional[ProfileFieldValue] = None
    pan_number: Optional[ProfileFieldValue] = None
    phone_number: Optional[ProfileFieldValue] = None
    email: Optional[ProfileFieldValue] = None
    annual_income: Optional[ProfileFieldValue] = None
    occupation: Optional[ProfileFieldValue] = None
    category: Optional[ProfileFieldValue] = None  # General / OBC / SC / ST / EWS
    state: Optional[ProfileFieldValue] = None
    district: Optional[ProfileFieldValue] = None
    pincode: Optional[ProfileFieldValue] = None
    full_address: Optional[ProfileFieldValue] = None
    landholding_acres: Optional[ProfileFieldValue] = None
    bank_account_number: Optional[ProfileFieldValue] = None
    bank_ifsc_code: Optional[ProfileFieldValue] = None
    custom_fields: dict[str, ProfileFieldValue] = Field(default_factory=dict)
