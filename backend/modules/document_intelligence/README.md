# Module 1 — Document Intelligence

## Value Proposition
Converts uploaded synthetic documents (PDFs and images) into OCR text and verified, schema-bound fields with source grounding, confidence metrics, and privacy masking.

## Standalone API Contract

### Primary Endpoint
`POST /v1/documents/extract`

#### Request (Multipart Form or Form Data)
- `file`: PDF or Image file (optional if `sample_key` is provided)
- `sample_key`: Key of synthetic document (`sample_aadhaar`, `sample_income_cert`, `sample_land_record`)
- `document_type_hint`: Optional hint (`identity_card`, `income_certificate`, `land_record`)
- `language_hint`: `en` or `hi`

#### Request (JSON)
`POST /v1/documents/extract-sample`
```json
{
  "sample_key": "sample_aadhaar"
}
```

#### Example Response
```json
{
  "document_id": "doc_synth_001",
  "detected_document_type": "identity_card",
  "raw_ocr_text": "GOVERNMENT OF INDIA\nUNIQUE IDENTIFICATION AUTHORITY OF INDIA\n...",
  "fields": [
    {
      "field_key": "full_name",
      "label_en": "Full Name",
      "label_hi": "पूरा नाम",
      "value": "Rajesh Kumar Verma",
      "masked_value": null,
      "source_text": "Name: Rajesh Kumar Verma",
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
      "source_text": "Aadhaar Number: 4589 1234 8901",
      "confidence": 0.99,
      "category": "identity",
      "is_sensitive": true
    }
  ],
  "quality_flags": [
    "Synthetic verification fixture; standard quality"
  ],
  "warnings": [],
  "requires_user_confirmation": true,
  "disclaimer": "Guidance only: Extracted details must be verified and confirmed by the user before use. The application does not assess legal authenticity."
}
```

## Grounding & Privacy Guarantees
1. **Evidence Grounding**: LLM-extracted values are cross-checked against raw OCR text. Hallucinated or non-existent values are flagged.
2. **Sensitive Value Masking**: Aadhaar numbers (`XXXX XXXX 1234`), PAN cards (`XXXXX1234X`), and Bank Account numbers are masked automatically.
3. **No Authenticity Claims**: The module explicitly assesses quality/risk flags, never claiming a document is legally genuine or fake.
