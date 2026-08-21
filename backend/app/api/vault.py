from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/v1/vault", tags=["Document Vault & Reminders"])


class VaultDocumentItem(BaseModel):
    id: str
    doc_type: str
    name_en: str
    name_hi: str
    file_name: Optional[str] = None
    extracted_fields_count: int = 0
    saved_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expiry_date: Optional[str] = None
    next_action_en: Optional[str] = None
    next_action_hi: Optional[str] = None
    is_synthetic_verified: bool = True
    tags: List[str] = Field(default_factory=list)


class ActionReminder(BaseModel):
    id: str
    title_en: str
    title_hi: str
    description_en: str
    description_hi: str
    due_date: str
    priority: str = "medium"  # high | medium | low
    action_url: Optional[str] = None
    is_completed: bool = False


# In-Memory storage for Demo session
DEMO_VAULT_DOCS: List[VaultDocumentItem] = [
    VaultDocumentItem(
        id="vault_doc_aadhaar",
        doc_type="identity_card",
        name_en="Aadhaar Card (Synthetic Demo)",
        name_hi="आधार कार्ड (सिंथेटिक डेमो)",
        file_name="synthetic_aadhaar.pdf",
        extracted_fields_count=5,
        saved_at="2026-08-01T10:00:00Z",
        expiry_date=None,
        next_action_en="Ready to use for scheme identity verification",
        next_action_hi="योजना पहचान सत्यापन के लिए उपयोग हेतु तैयार",
        is_synthetic_verified=True,
        tags=["Identity", "Aadhaar", "Verified"],
    ),
    VaultDocumentItem(
        id="vault_doc_khatauni",
        doc_type="land_record",
        name_en="Land Record Khatauni (Synthetic Demo)",
        name_hi="भू-अभिलेख खतौनी (सिंथेटिक डेमो)",
        file_name="synthetic_khatauni.pdf",
        extracted_fields_count=4,
        saved_at="2026-08-10T14:30:00Z",
        expiry_date="2027-03-31",
        next_action_en="Verified for PM-Kisan cultivable acreage proof",
        next_action_hi="पीएम-किसान कृषि भूमि रकबा प्रमाण हेतु सत्यापित",
        is_synthetic_verified=True,
        tags=["Agriculture", "Land Record", "Khatauni"],
    ),
]

DEMO_REMINDERS: List[ActionReminder] = [
    ActionReminder(
        id="rem_pmkisan_verify",
        title_en="Submit PM-Kisan Physical Form",
        title_hi="पीएम-किसान भौतिक आवेदन पत्र जमा करें",
        description_en="Take your printed readiness draft and attach self-attested Aadhaar & Khatauni copies to your local Agriculture office.",
        description_hi="अपने प्रिंटेड ड्राफ्ट के साथ आधार और खतौनी की स्व-प्रमाणित प्रति स्थानीय कृषि अधिकारी को जमा करें।",
        due_date="2026-09-01",
        priority="high",
        action_url="/form-readiness",
        is_completed=False,
    ),
    ActionReminder(
        id="rem_income_cert_renew",
        title_en="Income Certificate Annual Renewal Check",
        title_hi="आय प्रमाण पत्र वार्षिक नवीनीकरण जांच",
        description_en="State income certificates are typically valid for 3 financial years. Check expiry before applying for state scholarships.",
        description_hi="राज्य आय प्रमाण पत्र सामान्यतः 3 वित्तीय वर्षों के लिए मान्य होते हैं। छात्रवृत्ति आवेदन से पहले समाप्ति तिथि जांचें।",
        due_date="2026-10-15",
        priority="medium",
        action_url="/document-vault",
        is_completed=False,
    ),
]


@router.get("/documents", response_model=List[VaultDocumentItem])
def get_vault_documents():
    """Retrieve all saved documents in the user's vault."""
    return DEMO_VAULT_DOCS


@router.post("/documents", response_model=VaultDocumentItem)
def save_document_to_vault(doc: VaultDocumentItem):
    """Save a confirmed document to the user's vault."""
    # Check if ID already exists
    for existing in DEMO_VAULT_DOCS:
        if existing.id == doc.id:
            return existing

    DEMO_VAULT_DOCS.insert(0, doc)
    return doc


@router.delete("/documents/{doc_id}")
def delete_vault_document(doc_id: str):
    """Remove a document from the vault."""
    global DEMO_VAULT_DOCS
    initial_len = len(DEMO_VAULT_DOCS)
    DEMO_VAULT_DOCS = [d for d in DEMO_VAULT_DOCS if d.id != doc_id]
    if len(DEMO_VAULT_DOCS) == initial_len:
        raise HTTPException(status_code=404, detail="Document not found in vault.")
    return {"message": "Document deleted successfully", "doc_id": doc_id}


@router.get("/reminders", response_model=List[ActionReminder])
def get_action_reminders():
    """Get active action cards and expiry reminders."""
    return DEMO_REMINDERS
