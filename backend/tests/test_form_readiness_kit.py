import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.schemas.profile_schemas import CitizenProfile, ProfileFieldValue

client = TestClient(app)


@pytest.fixture
def sample_confirmed_profile():
    return CitizenProfile(
        full_name=ProfileFieldValue(value="Ramesh Kumar Sharma", source="sample_aadhaar", confidence=0.98),
        father_or_spouse_name=ProfileFieldValue(value="Ram Swaroop Sharma", source="sample_aadhaar", confidence=0.95),
        gender=ProfileFieldValue(value="Male", source="sample_aadhaar", confidence=0.98),
        aadhaar_number=ProfileFieldValue(value="9876 5432 1098", source="sample_aadhaar", confidence=0.99),
        state=ProfileFieldValue(value="Uttar Pradesh", source="sample_aadhaar", confidence=0.95),
        district=ProfileFieldValue(value="Varanasi", source="sample_aadhaar", confidence=0.95),
        pincode=ProfileFieldValue(value="221001", source="sample_aadhaar", confidence=0.95),
        landholding_acres=ProfileFieldValue(value=2.4, source="sample_khatauni", confidence=0.96),
    )


def test_list_templates():
    response = client.get("/v1/forms/templates")
    assert response.status_code == 200
    templates = response.json()
    assert len(templates) >= 2
    ids = [t["id"] for t in templates]
    assert "form_pm_kisan_app" in ids
    assert "form_income_cert_app" in ids


def test_get_template_by_id():
    response = client.get("/v1/forms/templates/form_pm_kisan_app")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "form_pm_kisan_app"
    assert "fields" in data
    assert len(data["fields"]) > 0


def test_prepare_form_plan_pm_kisan(sample_confirmed_profile):
    payload = {
        "form_id": "form_pm_kisan_app",
        "profile": sample_confirmed_profile.model_dump(),
        "language": "en",
    }
    response = client.post("/v1/forms/prepare", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["form_id"] == "form_pm_kisan_app"
    assert data["total_fields"] > 0
    assert data["completed_fields"] >= 7
    assert len(data["field_guidance_list"]) == data["total_fields"]

    # Verify applicant name guidance
    name_field = next(f for f in data["field_guidance_list"] if f["field_id"] == "f_applicant_name")
    assert name_field["proposed_value"] == "Ramesh Kumar Sharma"
    assert name_field["completion_state"] == "ready"
    assert "Write 'Ramesh Kumar Sharma'" in name_field["manual_instruction_en"]

    # Verify missing bank account field
    bank_field = next(f for f in data["field_guidance_list"] if f["field_id"] == "f_bank_account")
    assert bank_field["proposed_value"] is None
    assert bank_field["completion_state"] == "missing"
    assert "manually" in bank_field["manual_instruction_en"]


def test_generate_draft_pdf_bytes(sample_confirmed_profile):
    payload = {
        "form_id": "form_pm_kisan_app",
        "profile": sample_confirmed_profile.model_dump(),
        "language": "en",
    }
    response = client.post("/v1/forms/form_pm_kisan_app/draft-pdf", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000  # valid PDF bytes
