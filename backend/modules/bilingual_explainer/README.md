# Stretch Module: Bilingual Explainer & Embedded Guide

**Value:** Transforms dense, formal government scheme/form language into simple, easy-to-understand English and conversational Hindi (Devanagari). Provides an embedded context-aware assistant beside the active form and field.

## Standalone API Endpoints
- `POST /v1/explain` - Simplifies formal legal/scheme text with key takeaways and official citations.
- `POST /v1/assistant/chat` - Context-grounded conversational assistant that answers specific field/form questions without generic hallucination.
- `POST /v1/assistant/transcribe` - Transcribes English/Hindi voice audio via Groq Whisper.

## Request Example (`POST /v1/explain`)
```json
{
  "text": "Eligible operational landholders shall receive DBT of ₹6,000 annually payable in three tranches under the national farmer income security guidelines.",
  "context": "PM-Kisan Overview",
  "target_language": "hi"
}
```

## Response Example
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
