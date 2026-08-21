from fastapi import APIRouter, HTTPException, Response
from backend.app.schemas.form_schemas import (
    FormReadinessRequest,
    FormReadinessResponse,
    FormTemplate,
)
from backend.modules.form_readiness_kit.preparer import form_readiness_service

router = APIRouter(prefix="/v1/forms", tags=["Module 3: Form Readiness Kit"])


@router.get("/templates", response_model=list[dict])
def list_form_templates():
    """List all available supported form templates."""
    return form_readiness_service.load_form_templates()


@router.get("/templates/{form_id}", response_model=dict)
def get_form_template(form_id: str):
    """Retrieve details and field definitions for a specific form."""
    form = form_readiness_service.get_form_by_id(form_id)
    if not form:
        raise HTTPException(status_code=404, detail=f"Form with ID '{form_id}' not found.")
    return form


@router.post("/prepare", response_model=FormReadinessResponse)
def prepare_form(request: FormReadinessRequest):
    """
    Module 3 Core API:
    Generates a field-by-field completion plan for a target form using confirmed citizen profile data.
    """
    try:
        return form_readiness_service.prepare_form_plan(
            form_id=request.form_id,
            profile=request.profile,
            language=request.language,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate form plan: {e}")


@router.post("/{form_id}/draft-pdf")
def generate_form_draft_pdf(form_id: str, request: FormReadinessRequest):
    """
    Generates and downloads a watermarked PDF draft of the filled form.
    Bannered with 'Draft — Review Before Use'.
    """
    try:
        pdf_bytes = form_readiness_service.generate_pdf_draft_bytes(
            form_id=form_id,
            profile=request.profile,
            language=request.language,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={form_id}_readiness_draft.pdf"
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate draft PDF: {e}")
