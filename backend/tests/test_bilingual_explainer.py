import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_explain_text():
    payload = {
        "text": "Eligible operational landholders shall receive DBT of ₹6,000 annually payable in three tranches under the national farmer income security guidelines.",
        "context": "PM-Kisan Overview",
        "target_language": "hi",
    }
    response = client.post("/v1/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "simplified_en" in data
    assert "simplified_hi" in data
    assert len(data["key_takeaways_en"]) > 0


def test_assistant_chat_contextual():
    payload = {
        "user_message": "Why is my Aadhaar masked on the screen?",
        "language": "en",
        "current_context": "document_review",
        "active_field_id": "aadhaar_number",
    }
    response = client.post("/v1/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "response_text_en" in data
    assert "response_text_hi" in data
    assert "privacy" in data["response_text_en"].lower() or "mask" in data["response_text_en"].lower()


def test_vault_endpoints():
    response = client.get("/v1/vault/documents")
    assert response.status_code == 200
    docs = response.json()
    assert len(docs) >= 1

    reminders = client.get("/v1/vault/reminders")
    assert reminders.status_code == 200
    rems = reminders.json()
    assert len(rems) >= 1
