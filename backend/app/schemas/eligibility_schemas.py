from typing import Any, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.profile_schemas import CitizenProfile


class CriterionEvaluation(BaseModel):
    criterion_id: str
    label_en: str
    label_hi: str
    status: str = Field(description="met | not_met | needs_information")
    reason_en: str
    reason_hi: str
    rule_source_citation: Optional[str] = None
    required_value_description: Optional[str] = None
    actual_value: Optional[Any] = None


class SchemeRule(BaseModel):
    id: str
    version: str
    name_en: str
    name_hi: str
    category_en: str
    category_hi: str
    description_en: str
    description_hi: str
    official_source_url: str
    criteria: list[dict[str, Any]]
    required_documents: list[dict[str, str]]


class EligibilityEvaluationRequest(BaseModel):
    scheme_id: str
    profile: CitizenProfile
    available_document_types: list[str] = Field(default_factory=list)
    language: str = "en"


class EligibilityEvaluationResponse(BaseModel):
    scheme_id: str
    scheme_name: str
    status: str = Field(description="likely_match | not_a_match | needs_information")
    summary_explanation_en: str
    summary_explanation_hi: str
    criteria_evaluations: list[CriterionEvaluation]
    missing_fields: list[dict[str, str]] = Field(default_factory=list)
    missing_documents: list[dict[str, str]] = Field(default_factory=list)
    next_actions_en: list[str] = Field(default_factory=list)
    next_actions_hi: list[str] = Field(default_factory=list)
    official_source_url: str
    disclaimer: str = (
        "Guidance only: This is an automated assessment based solely on the details provided. "
        "It does not guarantee official government scheme eligibility. Please verify on the official portal."
    )
