import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.schemas.profile_schemas import CitizenProfile, ProfileFieldValue
from backend.modules.eligibility_copilot.evaluator import eligibility_copilot_service


client = TestClient(app)


def test_list_schemes():
    response = client.get("/v1/eligibility/schemes")
    assert response.status_code == 200
    schemes = response.json()
    assert len(schemes) >= 3
    scheme_ids = [s["id"] for s in schemes]
    assert "scheme_pm_kisan" in scheme_ids
    assert "scheme_pm_awas" in scheme_ids
    assert "scheme_old_age_pension" in scheme_ids


def test_pm_kisan_likely_match():
    # Profile of qualifying farmer (41 yrs old, UP resident, 3.08 acres)
    profile = {
        "full_name": {"value": "Rajesh Kumar Verma"},
        "age": {"value": 41},
        "state": {"value": "Uttar Pradesh"},
        "landholding_acres": {"value": 3.08},
    }
    payload = {
        "scheme_id": "scheme_pm_kisan",
        "profile": profile,
        "available_document_types": ["identity_card", "land_record", "bank_passbook"],
        "language": "en",
    }

    response = client.post("/v1/eligibility/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "likely_match"
    assert len(data["missing_fields"]) == 0
    assert len(data["missing_documents"]) == 0
    for crit in data["criteria_evaluations"]:
        assert crit["status"] == "met"
        assert crit["rule_source_citation"] is not None


def test_pm_kisan_needs_information():
    # Profile missing landholding and missing documents
    profile = {
        "full_name": {"value": "Rajesh Kumar Verma"},
        "age": {"value": 41},
        "state": {"value": "Uttar Pradesh"},
        # landholding missing
    }
    payload = {
        "scheme_id": "scheme_pm_kisan",
        "profile": profile,
        "available_document_types": ["identity_card"],
        "language": "hi",
    }

    response = client.post("/v1/eligibility/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "needs_information"
    assert len(data["missing_fields"]) == 1
    assert data["missing_fields"][0]["field_key"] == "landholding_acres"
    assert len(data["missing_documents"]) >= 1


def test_pm_kisan_not_a_match():
    # Landholding exceeds maximum limit (> 5.0 acres)
    profile = {
        "full_name": {"value": "Large Farmer"},
        "age": {"value": 45},
        "state": {"value": "Uttar Pradesh"},
        "landholding_acres": {"value": 15.5},  # Exceeds 5.0 acres
    }
    payload = {
        "scheme_id": "scheme_pm_kisan",
        "profile": profile,
        "available_document_types": ["identity_card", "land_record", "bank_passbook"],
    }

    response = client.post("/v1/eligibility/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "not_a_match"
    land_crit = next(c for c in data["criteria_evaluations"] if c["criterion_id"] == "crit_landholding")
    assert land_crit["status"] == "not_met"


def test_age_computation_from_dob():
    # Age is omitted, but DOB is provided (DOB: 14/08/1984 -> adult > 18)
    profile = CitizenProfile(
        date_of_birth=ProfileFieldValue(value="14/08/1984"),
        state=ProfileFieldValue(value="Uttar Pradesh"),
        landholding_acres=ProfileFieldValue(value=2.0),
    )
    res = eligibility_copilot_service.evaluate(
        scheme_id="scheme_pm_kisan",
        profile=profile,
        available_document_types=["identity_card", "land_record", "bank_passbook"],
    )
    assert res.status == "likely_match"
    age_crit = next(c for c in res.criteria_evaluations if c.criterion_id == "crit_age")
    assert age_crit.status == "met"
    assert age_crit.actual_value >= 18
