# HACQUIRE 2026 - Paperwork & Access

## Read first

This is a fresh build. Before planning, designing, or coding, read:

1. `AGENTS.md` - the product and engineering contract.
2. `.stitch/SITE.md` - product scope and screen map.
3. `.stitch/DESIGN.md` - visual design system.
4. `techstack.md` - baseline technology decisions; where this file conflicts with it, this file wins.

Do not reuse old code, local-LLM assumptions, or unverified requirements from a prior attempt.

## Problem statement

HACQUIRE PS-10, **Paperwork & Access**: government schemes, forms, claims, and documents are difficult to navigate for people with limited digital literacy or who do not understand formal English. Build a product that makes these services understandable and actionable using document OCR, eligibility guidance, form preparation, and bilingual explanations.

The product provides guidance only. It never claims official eligibility, legal advice, government affiliation, successful submission, or that a document is genuine/fake.

## Product name and promise

**Paperwork & Access** is a bilingual form assistant for English and Hindi. It helps a person understand a form, check whether they may qualify before spending effort, gather only the information they need, prepare every field correctly, and keep useful documents ready for reuse.

## Main user experience

### One complete demo journey

1. The user signs in with Firebase or chooses a clearly labelled Demo Guest mode.
2. The user chooses English or Hindi. UI copy changes immediately. Generated Hindi content always has an **Original English** toggle because translations may need verification.
3. The user chooses **Understand a form** or **Prepare a form**, then uploads a supported synthetic form (PDF/image) or opens one supported sample form.
4. The app shows the original form alongside simple-language guidance. The voice/type guide answers questions about the specific form or field currently in view.
5. Before demanding documents, the app lists transparent eligibility conditions and tells the user what facts/documents are still needed to check them.
6. The user enters facts or uploads a synthetic supporting document. Document Intelligence extracts candidate fields; the user reviews and confirms them.
7. The app creates a field-by-field readiness plan. For a fillable digital form, it makes a draft; for a manual/scanned form, it says exactly what to write in each field and why.
8. The user may save confirmed synthetic documents to a vault and sees a clear next action.

### Core design rule

Never send a user into an open-ended chatbot. Put conversational help beside the relevant form, eligibility result, document, or field. Every assistant response must also be available in writing.

## Main app and separately sellable modules

The **main app** owns Firebase authentication, user preference, vault metadata, navigation, and the complete journey. It combines independently usable modules via HTTP APIs. The main app must call each module through its public API rather than importing its internal business logic.

### Module 1 - Document Intelligence

**Value:** An image/PDF becomes OCR text plus editable, structured fields.

**API:** `POST /v1/documents/extract`

**Input:** Uploaded image/PDF plus optional document type.

**Output:** Raw OCR text, detected type, fields, evidence/confidence, masked sensitive values, and warnings.

**Reuse in main app:** Profile/evidence creation and form-specific supporting-document collection.

**Rules:** Use PaddleOCR/PyMuPDF for document processing. Groq may convert OCR text to schema-bound fields, but backend validation must confirm evidence in the OCR text and the user must confirm every result. Use synthetic data only.

### Module 2 - Eligibility Copilot

**Value:** A confirmed profile is checked against readable rules and returns transparent guidance.

**API:** `POST /v1/eligibility/evaluate`

**Input:** Confirmed profile, document availability, selected scheme/rule set, language.

**Output:** `likely_match`, `not_a_match`, or `needs_information`; criterion-by-criterion reasons, missing facts/documents, next actions, and disclaimer.

**Reuse in main app:** Run before asking users for unnecessary documents and again after they provide new information.

**Rules:** Scheme rules live as versioned human-readable JSON. Groq may normalize free text and generate bilingual explanations, but a deterministic evaluator verifies every result. Never promise eligibility or invent a requirement.

### Module 3 - Form Readiness Kit

**Value:** A form plus confirmed information becomes a precise completion plan.

**API:** `POST /v1/forms/prepare`

**Input:** Form template/field schema plus confirmed profile and language.

**Output:** Every form field, field label, simple explanation, proposed value/source, confidence, missing requirement, and checklist.

**Reuse in main app:** This is the core “prepare my form” screen.

**Rules:** A digital fillable PDF may receive a draft only when its fields are safely mapped. A scanned/manual form must receive a field-by-field “write this here” plan, never a false claim of automatic completion. The user reviews every value.

### Stretch module - Bilingual Explainer

**API:** `POST /v1/explain`

**Value:** Formal form/scheme text becomes short, plain English/Hindi explanations, with source/original text always accessible.

Use Gemini TTS for short English/Hindi spoken output and Groq Whisper for short English/Hindi speech-to-text. Voice is an enhancement; typed guidance must always work.

## Research, verification, and safety boundaries

- For the demo, use curated sample content or one user-provided official URL. Do not promise broad web research, legal loophole discovery, or exhaustive rejection-risk detection.
- Any source-derived claim must show its official source link and state that the user should verify current requirements with the official portal.
- Document “fraud detection” is stretch-only. At most, present quality/risk flags such as blur, missing fields, inconsistent values, or unsupported format. Do not label a document genuine, fake, forged, or legally valid.
- Never store API keys in the frontend, Firebase client configuration, Git, or sample files.
- Use Firebase for authentication, preference, and demo vault metadata. The backend handles Groq/Gemini keys and sensitive processing.

## Technology contract

- **Frontend:** React + TypeScript + Vite + Tailwind/shadcn UI.
- **Backend:** Python + FastAPI, responsible for all API calls and validation.
- **Auth/data:** Firebase Authentication and Firestore; include a Demo Guest fallback.
- **OCR/PDF:** PaddleOCR and PyMuPDF locally.
- **AI APIs:** Groq for structured extraction, eligibility explanation, and speech-to-text; Gemini TTS for short English/Hindi responses.
- **No local LLM:** Do not install Ollama, Qwen, faster-whisper, or Sherpa-ONNX.
- **Secrets:** Read `GROQ_API_KEY` and `GEMINI_API_KEY` only from backend environment variables.

## Repository structure

```text
frontend/                         # integrated React app
backend/
  app/orchestrator/               # main app workflow and API gateway
  modules/
    document-intelligence/        # sellable Module 1
    eligibility-copilot/          # sellable Module 2
    form-readiness-kit/           # sellable Module 3
firebase/                         # Firebase configuration and rules
.stitch/SITE.md
.stitch/DESIGN.md
```

Each sellable module needs an isolated service package, API route, README, `.env.example`, synthetic sample data, request/response example, basic tests, and a 30-45 second independent demo. Make the API contract stable and do not require the buyer to install the full main app.

## Time-boxed build priority

### Must build

1. One polished synthetic form/scheme flow from form understanding to a field-by-field completion plan.
2. Modules 1, 2, and 3 as independently callable APIs, integrated into the main flow.
3. English/Hindi UI, original/translation toggle, written assistant, and one short voice interaction.
4. API-key safety, loading/error states, and user confirmation before any value is reused.

### Build only if the above works

- Firebase sign-in and Firestore persistence (Demo Guest remains mandatory as fallback).
- Vault save action and an in-app reminder card.
- Fillable-PDF draft export for one supported template.
- Bilingual Explainer as a fourth sellable asset.

### Do not build unless all core work is complete

- Live third-party application-status tracking.
- Scheduled weekly jobs or browser push notifications.
- Arbitrary website scraping or “legal loophole” research.
- Genuine/fake document verification.

## Definition of done

- A demo user completes the single journey without a dead end.
- Each of the three core modules can be tested by API independently and runs without the main React app.
- The main app visibly calls and combines all three modules.
- The user can review/edit all extracted or proposed values before use.
- English/Hindi toggles work; original source/form wording is always available.
- Voice failure never blocks typed completion.
- All demos use synthetic data and all AI-driven output displays an appropriate guidance/verification message.
