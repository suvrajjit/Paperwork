# Module 3: Form Readiness Kit

**Sellable Standalone Service:** Transforms any form template and confirmed citizen profile into a sequential, field-by-field completion plan and generates watermarked downloadable draft PDFs.

---

## 1. Value Proposition
- **Sequential "Write This Here" Instructions**: Guides users filling physical or paper forms with exact words/numbers to write in every single box.
- **Data Provenance & Confidence**: Each proposed field value clearly states its origin (e.g. `doc_ocr_identity_card`, `user_input`).
- **Pre-Submission Checklist**: Generates targeted compliance checklists (attestations, attachments, verification steps).
- **Watermarked Draft PDF Generation**: Compiles ready fields into an official printable draft PDF stamped with safety verification watermarks.

---

## 2. API Contract

### Primary Endpoint: `POST /v1/forms/prepare`

#### Request Payload
```json
{
  "form_id": "form_pm_kisan_app",
  "language": "en",
  "profile": {
    "full_name": { "value": "Ramesh Kumar Sharma", "source": "aadhaar", "confidence": 0.98 },
    "aadhaar_number": { "value": "9876 5432 1098", "source": "aadhaar", "confidence": 0.99 },
    "state": { "value": "Uttar Pradesh", "source": "aadhaar", "confidence": 0.95 },
    "district": { "value": "Varanasi", "source": "aadhaar", "confidence": 0.95 },
    "pincode": { "value": "221001", "source": "aadhaar", "confidence": 0.95 },
    "landholding_acres": { "value": 2.4, "source": "khatauni", "confidence": 0.96 }
  }
}
```

#### Response Body
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
      "manual_instruction_en": "Write 'Ramesh Kumar Sharma' clearly in this box.",
      "manual_instruction_hi": "इस बॉक्स में स्पष्ट रूप से 'Ramesh Kumar Sharma' लिखें।"
    }
  ],
  "checklist_en": [
    "Ensure applicant name matches identically across Aadhaar and Land Records.",
    "Attach self-attested photocopy of Aadhaar Card and updated Khatauni."
  ],
  "can_generate_pdf_draft": true,
  "draft_download_url": "/v1/forms/form_pm_kisan_app/draft-pdf",
  "disclaimer": "Guidance only: Review all values before submitting to official authorities."
}
```

---

### PDF Download Endpoint: `POST /v1/forms/{form_id}/draft-pdf`
Returns a binary `application/pdf` stream of the compiled watermarked application draft.

---

## 3. Standalone 30-Second Demo Script
1. **Select Form Template**: Pick **PM-Kisan Farmer Form** or **Gold Loan Agreement**.
2. **Inject Profile**: Load confirmed synthetic profile data.
3. **Execute Readiness API**: Click **"Generate Readiness Plan"**.
4. **Show Field Breakdown**: Review the sequential "Write this here" steps and completion progress bar.
5. **Download Draft PDF**: Click **"Download Watermarked Draft PDF"** and preview the generated official PDF.

---

## 4. Standalone Execution & Tests
```bash
# Run unit tests
pytest backend/tests/test_form_readiness_kit.py
```
