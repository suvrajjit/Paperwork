import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.modules.document_intelligence.extractor import document_intelligence_service
from backend.app.schemas.document_schemas import ExtractedField


client = TestClient(app)


def test_list_synthetic_samples():
    response = client.get("/v1/documents/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) >= 3
    sample_keys = [s["key"] for s in samples]
    assert "sample_aadhaar" in sample_keys
    assert "sample_income_cert" in sample_keys
    assert "sample_land_record" in sample_keys


def test_extract_synthetic_aadhaar_via_api():
    response = client.post("/v1/documents/extract-sample", json={"sample_key": "sample_aadhaar"})
    assert response.status_code == 200
    data = response.json()
    assert data["detected_document_type"] == "identity_card"
    assert data["requires_user_confirmation"] is True
    assert "guidance" in data["disclaimer"].lower()

    fields_by_key = {f["field_key"]: f for f in data["fields"]}
    assert "full_name" in fields_by_key
    assert fields_by_key["full_name"]["value"] == "Rajesh Kumar Verma"

    # Verify Aadhaar masking
    assert "aadhaar_number" in fields_by_key
    assert fields_by_key["aadhaar_number"]["masked_value"] == "XXXX XXXX 8901"
    assert fields_by_key["aadhaar_number"]["is_sensitive"] is True


def test_extract_income_certificate():
    response = client.post("/v1/documents/extract-sample", json={"sample_key": "sample_income_cert"})
    assert response.status_code == 200
    data = response.json()
    assert data["detected_document_type"] == "income_certificate"
    fields_by_key = {f["field_key"]: f for f in data["fields"]}
    assert fields_by_key["annual_income"]["value"] == 72000


def test_masking_logic():
    masked_aadhaar = document_intelligence_service.mask_sensitive_value("aadhaar_number", "4589 1234 8901")
    assert masked_aadhaar == "XXXX XXXX 8901"

    masked_pan = document_intelligence_service.mask_sensitive_value("pan_number", "ABCDE1234F")
    assert masked_pan == "XXXXX1234X"


def test_grounding_verification():
    raw_text = "Applicant Name: Ramesh Chandra, Annual Income: Rs. 50,000"
    grounded_field = ExtractedField(
        field_key="full_name",
        label_en="Full Name",
        label_hi="पूरा नाम",
        value="Ramesh Chandra",
        source_text="Applicant Name: Ramesh Chandra",
    )
    assert document_intelligence_service.verify_grounding(grounded_field, raw_text) is True

    hallucinated_field = ExtractedField(
        field_key="full_name",
        label_en="Full Name",
        label_hi="पूरा नाम",
        value="Fake Nonexistent Person",
        source_text="Made up source",
    )
    assert document_intelligence_service.verify_grounding(hallucinated_field, raw_text) is False
