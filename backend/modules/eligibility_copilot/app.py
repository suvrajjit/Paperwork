from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import os
import sys

# Support relative imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.modules.eligibility_copilot.evaluator import eligibility_copilot_service

app = FastAPI(
    title="Eligibility Copilot Standalone Service",
    description="Deterministic public scheme eligibility evaluator with transparent citations and missing data guidance.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EvaluateRequest(BaseModel):
    scheme_id: str
    profile: Dict[str, Any]
    available_document_types: List[str] = Field(default_factory=list)
    language: str = "en"


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "eligibility-copilot",
        "version": "1.0.0",
    }


@app.get("/v1/eligibility/schemes")
def list_schemes():
    return eligibility_copilot_service.list_schemes()


@app.get("/v1/eligibility/schemes/{scheme_id}")
def get_scheme(scheme_id: str):
    scheme = eligibility_copilot_service.get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme


@app.post("/v1/eligibility/evaluate")
def evaluate_eligibility(req: EvaluateRequest):
    try:
        return eligibility_copilot_service.evaluate(
            scheme_id=req.scheme_id,
            profile=req.profile,
            available_document_types=req.available_document_types,
            language=req.language,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eligibility evaluation error: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
