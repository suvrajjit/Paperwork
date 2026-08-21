from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel
import os
import sys

# Support relative imports whether run standalone or as part of monorepo
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.modules.document_intelligence.extractor import document_intelligence_service

app = FastAPI(
    title="Document Intelligence Standalone Service",
    description="Converts synthetic documents (PDF/images) into OCR text and verified schema-bound fields.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "document-intelligence",
        "version": "1.0.0",
    }


@app.post("/v1/documents/extract")
async def extract_document(
    sample_key: Optional[str] = None,
    document_type_hint: Optional[str] = None,
    language_hint: Optional[str] = "en",
    file: Optional[UploadFile] = File(None),
):
    try:
        if file:
            file_bytes = await file.read()
            return document_intelligence_service.extract(
                file_bytes=file_bytes,
                filename=file.filename or "uploaded_doc.pdf",
                document_type_hint=document_type_hint,
                language_hint=language_hint or "en",
            )
        elif sample_key:
            return document_intelligence_service.extract_sample(sample_key=sample_key)
        else:
            return document_intelligence_service.extract_sample(sample_key="sample_aadhaar")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document extraction error: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
