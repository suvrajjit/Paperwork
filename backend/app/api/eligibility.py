from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.eligibility_schemas import (
    EligibilityEvaluationRequest,
    EligibilityEvaluationResponse,
)
from backend.modules.eligibility_copilot.evaluator import eligibility_copilot_service

router = APIRouter(prefix="/v1/eligibility", tags=["Module 2 — Eligibility Copilot"])


@router.get("/schemes", summary="List Available Schemes")
def list_schemes(category: Optional[str] = None):
    """Retrieve all supported government schemes with bilingual metadata and criteria descriptions."""
    schemes = eligibility_copilot_service.load_schemes()
    if category:
        schemes = [s for s in schemes if s.get("category_en", "").lower() == category.lower()]
    return schemes


@router.get("/schemes/{scheme_id}", summary="Get Scheme Details")
def get_scheme_details(scheme_id: str):
    """Get full details, criteria, citations, and required documents for a specific scheme."""
    scheme = eligibility_copilot_service.get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_id}' not found.")
    return scheme


@router.post("/evaluate", response_model=EligibilityEvaluationResponse, summary="Evaluate Eligibility")
def evaluate_eligibility(request: EligibilityEvaluationRequest):
    """
    Evaluate a confirmed citizen profile against versioned criteria.
    Returns likely_match, needs_information, or not_a_match with criterion-by-criterion citations.
    """
    try:
        response = eligibility_copilot_service.evaluate(
            scheme_id=request.scheme_id,
            profile=request.profile,
            available_document_types=request.available_document_types,
            language=request.language or "en",
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eligibility evaluation failed: {str(e)}")
