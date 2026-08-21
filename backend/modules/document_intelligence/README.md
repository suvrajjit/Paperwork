# Module 1: Document Intelligence

**Sellable Standalone Service:** Converts uploaded PDFs and images into structured, schema-bound fields with OCR text, confidence scores, evidence grounding, and privacy masking.

---

## 1. Value Proposition
- **Turn Unstructured Documents into Structured Data**: Converts scanned or photographed documents (Aadhaar, Land Records, Bank Agreements, Income Certificates) into clean JSON data.
- **Evidence-Grounded**: Every extracted field is verified against raw OCR text with confidence scoring.
- **Privacy-First Masking**: Automatically masks sensitive identifiers (Aadhaar `XXXX XXXX 1098`, PAN, Account Numbers).
- **Quality & Format Flags**: Flags image blur, missing sections, and formatting issues without false authenticity claims.

---

## 2. API Contract

### Endpoint: `POST /v1/documents/extract`

#### Headers
```http
Content-Type: multipart/form-data
```

#### Request Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | File (PDF/Image) | Optional* | The uploaded document binary. (*Either `file` or `sample_key` is required) |
| `sample_key` | string | Optional* | Synthetic test fixture (`sample_aadhaar`, `sample_khatauni`, `sample_income_certificate`). |
| `document_type_hint` | string | Optional | Hint for document category (`identity_card`, `land_record`, `income_certificate`, `loan_application_form`). |
| `language_hint` | string | Optional | Primary language hint (`en` or `hi`). Default: `en`. |

---

## 3. Example Request & Response

### cURL Request
```bash
curl -X POST "http://localhost:8000/v1/documents/extract?sample_key=sample_aadhaar" \
     -H "Accept: application/json"
```

### Python Request
```python
import requests

url = "http://localhost:8000/v1/documents/extract"
files = {"file": open("aadhaar_sample.pdf", "rb")}
params = {"document_type_hint": "identity_card", "language_hint": "en"}

response = requests.post(url, files=files, params=params)
print(response.json())
```

### JSON Response
```json
{
  "document_id": "doc_synth_001",
  "detected_document_type": "identity_card",
  "raw_ocr_text": "GOVERNMENT OF INDIA\nUNIQUE IDENTIFICATION AUTHORITY OF INDIA\nName: Ramesh Kumar Sharma\nDOB: 12/04/1982\nGender: Male\n4589 1234 8901",
  "fields": [
    {
      "field_key": "full_name",
      "label_en": "Full Name",
      "label_hi": "पूरा नाम",
      "value": "Ramesh Kumar Sharma",
      "masked_value": null,
      "source_text": "Name: Ramesh Kumar Sharma",
      "confidence": 0.98,
      "category": "identity",
      "is_sensitive": false
    },
    {
      "field_key": "aadhaar_number",
      "label_en": "Aadhaar Number",
      "label_hi": "आधार संख्या",
      "value": "4589 1234 8901",
      "masked_value": "XXXX XXXX 8901",
      "source_text": "4589 1234 8901",
      "confidence": 0.99,
      "category": "identity",
      "is_sensitive": true
    }
  ],
  "quality_flags": [
    "High contrast digital scan",
    "Text alignment verified"
  ],
  "warnings": [],
  "requires_user_confirmation": true,
  "disclaimer": "Guidance only: Extracted details must be verified by the user before use. The system does not certify legal validity."
}
```

---

## 4. Standalone 30-Second Demo Script
1. **Show Upload**: Open the standalone Document Intelligence Playground and upload a PDF or select `sample_aadhaar`.
2. **Execute OCR**: Click **"Run Extraction API"**.
3. **Highlight Features**:
   - Point out **Confidence Scores** (e.g. `99%`).
   - Point out **Privacy Masking** (`XXXX XXXX 8901`).
   - Point out **Raw OCR Evidence grounding**.
4. **Show JSON Export**: Toggle the raw JSON viewer showing the clean schema payload.

---

## 5. Standalone Execution & Tests
```bash
# Run unit tests
pytest backend/tests/test_document_intelligence.py
```
