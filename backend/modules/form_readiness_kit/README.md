# Module 3: Form Readiness Kit

**Product Promise:** Converts a target form template and confirmed citizen profile into a field-by-field completion plan.
Provides clear, bilingual 'write this here' instructions for manual forms and generates downloadable draft PDFs with safety banners.

## Standalone Value
- **API Endpoint:** `POST /v1/forms/prepare`
- **Draft PDF Generation:** `POST /v1/forms/{form_id}/draft-pdf`
- **Output:** Sequential numbered field plan, pre-filled values with source provenance, exact manual writing guidance, and pre-submission checklist.

## Request Example
```json
{
  "form_id": "form_pm_kisan_app",
  "profile": {
    "full_name": {"value": "Ramesh Kumar Sharma", "source": "aadhaar"},
    "aadhaar_number": {"value": "9876 5432 1098", "source": "aadhaar"},
    "state": {"value": "Uttar Pradesh", "source": "aadhaar"},
    "district": {"value": "Varanasi", "source": "aadhaar"},
    "pincode": {"value": "221001", "source": "aadhaar"},
    "landholding_acres": {"value": 2.4, "source": "khatauni"}
  },
  "language": "en"
}
```

## Response Example
```json
{
  "form_id": "form_pm_kisan_app",
  "form_name_en": "PM-Kisan Farmer Enrollment Application Form",
  "form_name_hi": "प्रधानमंत्री किसान सम्मान निधि नामांकन आवेदन पत्र",
  "form_type": "manual",
  "total_fields": 10,
  "completed_fields": 6,
  "missing_fields_count": 4,
  "field_guidance_list": [
    {
      "field_id": "f_applicant_name",
      "label_en": "Farmer / Applicant's Full Name",
      "label_hi": "कृषक / आवेदक का पूरा नाम",
      "proposed_value": "Ramesh Kumar Sharma",
      "value_source": "document_confirmed",
      "completion_state": "ready",
      "manual_instruction_en": "Write 'Ramesh Kumar Sharma' clearly in this box/line."
    }
  ],
  "checklist_en": [
    "Ensure applicant name matches identically across Aadhaar and Land Records.",
    "Attach self-attested photocopy of Aadhaar Card and updated Khatauni."
  ],
  "can_generate_pdf_draft": true,
  "draft_download_url": "/v1/forms/form_pm_kisan_app/draft-pdf",
  "disclaimer": "Guidance only: Verify all values before final submission."
}
```

## Running Tests
```bash
pytest backend/tests/test_form_readiness_kit.py
```
