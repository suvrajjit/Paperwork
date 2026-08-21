# Module 4: Bilingual Explainer & Conversational Voice Agent

**Sellable Standalone Service:** Simplifies dense legal and bureaucratic text into short, clear English and Devanagari Hindi, and provides a multi-turn voice guide with STT & Gemini TTS.

---

## 1. Value Proposition
- **Plain-Language Simplification**: Translates complex government notifications and legal circulars into simple English and natural Hindi.
- **Key Takeaways & Citations**: Extracts 2-3 actionable bullet points and references the official scheme/circular URL.
- **Conversational Voice Guide**: Multi-turn dialogue agent capable of understanding citizen intent, determining navigation actions, and auto-filling form fields.
- **Real-Time Speech Synthesis (TTS)**: Produces natural human-quality audio using Google Gemini 2.5 Flash TTS (`pcm_24khz`).

---

## 2. API Contract

### 1. Plain-Language Explainer
`POST /v1/explain`

#### Request Payload
```json
{
  "text": "Eligible operational landholders shall receive DBT of ₹6,000 annually payable in three tranches under the national farmer income security guidelines.",
  "context": "PM-Kisan Scheme Overview",
  "target_language": "hi"
}
```

#### Response Body
```json
{
  "original_text": "Eligible operational landholders...",
  "simplified_en": "Farmers who own agricultural land get ₹6,000 per year in 3 equal payments of ₹2,000 sent directly to their bank account.",
  "simplified_hi": "कृषि भूमि के मालिक किसानों को प्रति वर्ष ₹6,000 की राशि ₹2,000 की 3 समान किस्तों में सीधे बैंक खाते में मिलती है।",
  "key_takeaways_en": [
    "Must own cultivable land in official land records.",
    "Payments go directly to Aadhaar-linked bank accounts."
  ],
  "official_source_citation": "PM-Kisan Portal (https://pmkisan.gov.in/)"
}
```

---

### 2. Conversational Voice Agent Guide
`POST /v1/assistant/agent/guide`

#### Request Payload
```json
{
  "user_message": "मुझे पीएम किसान फॉर्म भरना है",
  "language": "hi",
  "current_screen": "welcome",
  "agent_stage": "GREETING",
  "synthesize_audio": true
}
```

#### Response Body
```json
{
  "spoken_text_en": "Opening the PM-Kisan application form for you. Let's start with your basic farmer details.",
  "spoken_text_hi": "मैं आपके लिए पीएम-किसान आवेदन पत्र खोल रहा हूँ। आइए आपके किसान विवरण से शुरुआत करते हैं।",
  "action_type": "NAVIGATE",
  "agent_stage": "COLLECTING_MISSING_DATA",
  "target_screen": "form_workspace",
  "target_form_id": "form_pm_kisan_app",
  "target_field_id": "f_land_area",
  "suggested_quick_replies_hi": ["२.४ एकड़", "आधार सत्यापित करें", "पात्रता जांचें"],
  "audio_base64": "UklGRi...",
  "audio_format": "pcm_24khz"
}
```

---

## 3. Standalone 30-Second Demo Script
1. **Enter Legal Text**: Paste a dense government notification or policy clause into the Explainer Playground.
2. **Execute Explanation**: Click **"Explain in Hindi & English"**.
3. **Show Dual Output**: Point out the simplified English and Hindi bullet points side-by-side with official citations.
4. **Test Spoken Voice**: Click **"Play Audio"** to hear the natural Gemini TTS pronunciation.

---

## 4. Standalone Execution & Tests
```bash
# Run unit tests
pytest backend/tests/test_bilingual_explainer.py
```
