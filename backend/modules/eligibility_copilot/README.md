# Module 2: Eligibility Copilot

**Sellable Standalone Service:** Evaluates citizen profiles against transparent, human-readable government scheme rules with deterministic verdicts, official citations, and missing-data guidance.

---

## 1. Value Proposition
- **Transparent Criterion-by-Criterion Evaluation**: Evaluates whether a person qualifies for government subsidies, grants, or certificates before they invest time in paperwork.
- **Deterministic Rule Engine**: Calculation logic (age ranges, income caps, land boundaries) runs via explicit, verifiable rules rather than unconstrained LLM hallucinations.
- **Official Policy Grounding**: Every rule condition quotes and links directly to official government operational guidelines.
- **Actionable Missing-Data Feedback**: Identifies specific missing documents or unconfirmed facts needed to reach a definitive verdict.

---

## 2. API Contract

### Endpoint: `POST /v1/eligibility/evaluate`

#### Headers
```http
Content-Type: application/json
```

#### Request Payload
```json
{
  "scheme_id": "scheme_pm_kisan",
  "language": "en",
  "available_document_types": ["identity_card", "land_record"],
  "profile": {
    "full_name": { "value": "Ramesh Kumar Sharma" },
    "age": { "value": 42 },
    "state": { "value": "Uttar Pradesh" },
    "landholding_acres": { "value": 2.4 },
    "annual_income": { "value": 72000 }
  }
}
```

---

## 3. Example Response
```json
{
  "scheme_id": "scheme_pm_kisan",
  "scheme_name": "PM-Kisan Samman Nidhi (Farmer Income Support)",
  "status": "likely_match",
  "summary_explanation_en": "Based on your confirmed profile, you appear to meet the core requirements for PM-Kisan Samman Nidhi.",
  "summary_explanation_hi": "आपकी पुष्टीकृत जानकारी के आधार पर, आप प्रधानमंत्री किसान सम्मान निधि के मुख्य पात्रता मानदंडों को पूरा करते प्रतीत होते हैं।",
  "criteria_evaluations": [
    {
      "criterion_id": "crit_age",
      "label_en": "Applicant Age (18+ years)",
      "label_hi": "आवेदक की आयु (18 वर्ष या अधिक)",
      "status": "met",
      "reason_en": "Value (42.0) meets the minimum requirement of 18.0.",
      "reason_hi": "दर्ज मान (42.0) न्यूनतम आवश्यकता (18.0) को पूरा करता है।",
      "rule_source_citation": "PM-Kisan Operational Guidelines Sec 2.1 — Applicant must be an adult family head/member.",
      "actual_value": 42
    },
    {
      "criterion_id": "crit_landholding",
      "label_en": "Cultivable Landholding (Up to 5 Acres)",
      "label_hi": "कृषि योग्य भूमि का स्वामित्व (5 एकड़ तक)",
      "status": "met",
      "reason_en": "Value (2.4) falls within the required range (0.01 to 5.0).",
      "reason_hi": "दर्ज मान (2.4) आवश्यक सीमा (0.01 से 5.0) के भीतर है।",
      "rule_source_citation": "PM-Kisan Operational Guidelines Sec 3.2 — Must possess cultivable land entered in State Land Records (Khatauni/RoR).",
      "actual_value": 2.4
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
  "disclaimer": "Guidance only: Automated assessment based solely on confirmed details. Does not guarantee official government approval."
}
```

---

## 4. Standalone 30-Second Demo Script
1. **Select Scheme**: Choose **PM-Kisan Farmer Scheme** or **Income Certificate**.
2. **Toggle Values**: Change landholding to `12.0 acres` (exceeds cap) -> Watch status update to `not_a_match` with clear explanation.
3. **Set Valid Values**: Set landholding to `2.4 acres` -> Status updates to `likely_match` with green criteria checks.
4. **Show Citations**: Point out the official guideline citations on each criterion.

---

## 5. Standalone Execution & Tests
```bash
# Run unit tests
pytest backend/tests/test_eligibility_copilot.py
```
