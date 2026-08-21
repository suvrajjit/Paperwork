# Module 2 — Eligibility Copilot

## Value Proposition
Evaluates a confirmed citizen profile against human-readable, versioned public scheme criteria. Returns transparent, criterion-by-criterion verdicts with official citations, missing fact prompts, and required document checklists before users waste effort on non-qualifying applications.

## Standalone API Contract

### 1. List Supported Schemes
`GET /v1/eligibility/schemes`
Returns all registered schemes with bilingual descriptions and official source links.

### 2. Evaluate Citizen Profile
`POST /v1/eligibility/evaluate`

#### Request Body
```json
{
  "scheme_id": "scheme_pm_kisan",
  "language": "en",
  "available_document_types": ["identity_card", "land_record", "bank_passbook"],
  "profile": {
    "full_name": { "value": "Rajesh Kumar Verma" },
    "age": { "value": 41 },
    "state": { "value": "Uttar Pradesh" },
    "landholding_acres": { "value": 3.08 }
  }
}
```

#### Response Body
```json
{
  "scheme_id": "scheme_pm_kisan",
  "scheme_name": "PM-Kisan Samman Nidhi (Farmer Income Support)",
  "status": "likely_match",
  "summary_explanation_en": "Based on the confirmed information provided, you appear to meet the primary criteria for PM-Kisan Samman Nidhi...",
  "summary_explanation_hi": "प्रदान की गई सत्यापित जानकारी के आधार पर, आप प्रधानमंत्री किसान सम्मान निधि के मुख्य पात्रता मानदंडों को पूरा करते प्रतीत होते हैं...",
  "criteria_evaluations": [
    {
      "criterion_id": "crit_age",
      "label_en": "Applicant Age (18+ years)",
      "label_hi": "आवेदक की आयु (18 वर्ष या अधिक)",
      "status": "met",
      "reason_en": "Value (41.0) meets the minimum requirement of 18.0.",
      "reason_hi": "दर्ज मान (41.0) न्यूनतम आवश्यकता (18.0) को पूरा करता है।",
      "rule_source_citation": "PM-Kisan Operational Guidelines Sec 2.1 — Applicant must be an adult family head/member.",
      "actual_value": 41
    },
    {
      "criterion_id": "crit_landholding",
      "label_en": "Cultivable Landholding (Up to 5 Acres)",
      "label_hi": "कृषि योग्य भूमि का स्वामित्व (5 एकड़ तक)",
      "status": "met",
      "reason_en": "Value (3.08) falls within the required range (0.01 to 5.0).",
      "reason_hi": "दर्ज मान (3.08) आवश्यक सीमा (0.01 से 5.0) के भीतर है।",
      "rule_source_citation": "PM-Kisan Operational Guidelines Sec 3.2 — Must possess cultivable land entered in State Land Records (Khatauni/RoR).",
      "actual_value": 3.08
    }
  ],
  "missing_fields": [],
  "missing_documents": [],
  "next_actions_en": [
    "Proceed to Form Preparation to generate your field-by-field completion plan."
  ],
  "next_actions_hi": [
    "फ़ॉर्म भरने की तैयारी शुरू करें और फ़ील्ड-वार मार्गदर्शन प्राप्त करें।"
  ],
  "official_source_url": "https://pmkisan.gov.in/",
  "disclaimer": "Guidance only: This is an automated assessment based solely on the details provided. It does not guarantee official government scheme eligibility. Please verify on the official portal."
}
```

## Determinism & Rule Guarantees
1. **Deterministic Authority**: All calculations (age thresholds, income limits, land ranges) are executed by explicit Python rule logic. The LLM does not make arbitrary eligibility decisions.
2. **Transparent Citations**: Every individual criterion links directly to its source section in government operational guidelines.
3. **Privacy by Default**: The evaluator functions strictly with confirmed user-provided fields.
