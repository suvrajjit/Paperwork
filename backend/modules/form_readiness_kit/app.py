from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional
from pydantic import BaseModel
import os
import sys

# Support relative imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.modules.form_readiness_kit.preparer import form_readiness_service
from backend.app.services.documents.pdf_generator import pdf_generator_service

app = FastAPI(
    title="Form Readiness Kit Standalone Service",
    description="Field-by-field completion plan and watermarked draft PDF generator.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PrepareFormRequest(BaseModel):
    form_id: str
    profile: Dict[str, Any]
    language: str = "en"


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "form-readiness-kit",
        "version": "1.0.0",
    }


@app.get("/v1/forms/templates")
def list_form_templates():
    return form_readiness_service.list_templates()


@app.get("/v1/forms/templates/{form_id}")
def get_form_template(form_id: str):
    template = form_readiness_service.get_template_by_id(form_id)
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")
    return template


@app.post("/v1/forms/prepare")
def prepare_form_readiness(req: PrepareFormRequest):
    try:
        return form_readiness_service.prepare(
            form_id=req.form_id,
            profile=req.profile,
            language=req.language,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Form preparation error: {e}")


@app.post("/v1/forms/{form_id}/draft-pdf")
def generate_draft_pdf(form_id: str, req: PrepareFormRequest):
    try:
        pdf_bytes = pdf_generator_service.generate_draft_pdf(
            form_id=form_id,
            profile_data=req.profile,
            language=req.language,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Draft_{form_id}.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Draft PDF generation failed: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
