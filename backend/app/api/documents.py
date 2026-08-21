from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Body
from backend.app.schemas.document_schemas import DocumentExtractionResponse
from backend.modules.document_intelligence.extractor import document_intelligence_service
from backend.app.data.synthetic_documents import SYNTHETIC_DOCUMENTS

router = APIRouter(prefix="/v1/documents", tags=["Module 1 — Document Intelligence"])


@router.get("/samples", summary="List Synthetic Sample Documents")
def list_synthetic_samples():
    """Returns the list of available synthetic demo documents."""
    return [
        {
            "key": key,
            "id": data["id"],
            "name": data["name"],
            "doc_type": data["doc_type"],
            "description": data["description"],
        }
        for key, data in SYNTHETIC_DOCUMENTS.items()
    ]


@router.post("/extract", response_model=DocumentExtractionResponse, summary="Extract Fields from Document")
async def extract_document(
    file: Optional[UploadFile] = File(None),
    sample_key: Optional[str] = Form(None),
    document_type_hint: Optional[str] = Form(None),
    language_hint: Optional[str] = Form("en"),
):
    """
    Extract structured fields from an uploaded PDF/image or synthetic demo document.
    Enforces evidence grounding and masks sensitive identifiers.
    """
    try:
        file_bytes = None
        filename = None

        if file:
            file_bytes = await file.read()
            filename = file.filename

        response = document_intelligence_service.extract(
            file_bytes=file_bytes,
            filename=filename,
            sample_key=sample_key,
            document_type_hint=document_type_hint,
            language_hint=language_hint or "en",
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document extraction failed: {str(e)}")


@router.post("/extract-sample", response_model=DocumentExtractionResponse, summary="Extract from Sample Key (JSON)")
def extract_sample_json(
    sample_key: str = Body(..., embed=True),
):
    """Convenience JSON endpoint to extract structured fields for a synthetic sample."""
    if sample_key not in SYNTHETIC_DOCUMENTS:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_key}' not found.")
    return document_intelligence_service.extract_from_synthetic_sample(sample_key)
