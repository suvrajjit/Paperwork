# Tech Stack — Paperwork & Access

## 1. Project Overview

Paperwork & Access is a bilingual, voice-guided application assistant that helps users:

- Understand government and institutional forms.
- Check eligibility before spending time gathering documents.
- Extract information from uploaded documents.
- Reuse confirmed information across multiple forms and workflows.
- Prepare both digital/fillable and manual forms.
- Understand complicated terminology in simple English or Hindi.
- Interact with a conversational voice assistant.
- Store documents securely for future reuse and attention reminders.

The system is designed as **one integrated application composed of three independently sellable feature modules**:

1. **Document Intelligence**
2. **Eligibility Copilot**
3. **Form Readiness Kit**

The modules share infrastructure and can be reused multiple times throughout the user journey, but each must maintain a clear API boundary and independent responsibility.

---

# 2. Technology Principles

The implementation must follow these principles:

### 2.1 Keep the architecture simple

This is a time-constrained hackathon implementation.

Do not introduce unnecessary:

- microservices;
- Docker orchestration;
- Kubernetes;
- Redis;
- message queues;
- PostgreSQL;
- separate frontend applications;
- locally hosted LLMs.

The three modules are **logical/API boundaries inside one backend**, not three independently deployed servers.

### 2.2 Use hosted AI where it saves development time

AI inference should use:

- Groq for LLM reasoning and speech-to-text.
- Gemini for text-to-speech.

Do not require local LLM inference.

### 2.3 Keep deterministic logic deterministic

LLMs may interpret, normalize, explain, and assist.

They must not independently make authoritative eligibility decisions.

Eligibility conclusions must ultimately be validated against explicit, readable rules.

### 2.4 Keep sensitive API keys server-side

Groq and Gemini credentials must never be exposed to the React application.

All calls requiring secret API keys must go through FastAPI.

### 2.5 Prefer reusable interfaces

A module should be usable by the main application without knowing its internal implementation.

---

# 3. Frontend

## Core

- **React**
- **TypeScript**
- **Vite**

React provides the main user-facing application.

TypeScript is required for typed API contracts, form state, user profiles, extracted fields, and module responses.

Vite is used for development and production builds.

## Styling

- **Tailwind CSS**

Use Tailwind for application styling rather than introducing a large UI framework.

## Icons

- **Lucide React**

Use Lucide icons consistently throughout the interface.

## Design

The visual implementation should follow:

- `DESIGN.md`
- Stitch-generated screens/components
- responsive layouts
- accessible controls
- clear English/Hindi language switching

Stitch is a **design/prototyping tool**, not a runtime dependency.

---

# 4. Backend

## Core

- **Python 3.11+**
- **FastAPI**
- **Uvicorn**
- **Pydantic**

FastAPI provides:

- REST APIs;
- request validation;
- response schemas;
- automatic OpenAPI documentation;
- module API boundaries.

Uvicorn runs the FastAPI application.

Pydantic defines strict schemas for:

- user profiles;
- extracted fields;
- eligibility requests/results;
- form fields;
- documents;
- assistant messages.

---

# 5. Project-Local Python Environment

Python dependencies must **never be installed globally**.

Create a project-local environment:

```powershell
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies only after activation.

Add:

```text
.venv/
```

to `.gitignore`.

The README must document Windows setup and activation.

---

# 6. Document Intelligence

## OCR

**PaddleOCR**

Used for:

- printed document OCR;
- English text;
- Hindi/Devanagari text;
- text localization;
- bounding boxes;
- OCR confidence.

## PDF processing

**PyMuPDF**

Used for:

- reading PDFs;
- extracting PDF pages;
- rendering pages when necessary;
- detecting whether a PDF contains selectable text;
- preparing PDF pages for OCR.

## Image processing

**Pillow**

Used for:

- image loading;
- resizing;
- format conversion;
- preprocessing where necessary.

---

# 7. Document Intelligence Pipeline

The pipeline is:

```text
Image / PDF
     ↓
PyMuPDF / Pillow
     ↓
PaddleOCR
     ↓
OCR text + positions + confidence
     ↓
Groq LLM
     ↓
Structured field extraction
     ↓
Deterministic validation
     ↓
User confirmation
     ↓
Confirmed profile/document JSON
```

The LLM must never be allowed to silently invent information.

Every extracted field should contain enough provenance to determine where the value came from.

Example:

```json
{
  "fullName": {
    "value": "Example User",
    "sourceText": "Name: Example User",
    "confidence": 0.94
  }
}
```

The backend should reject or flag values that cannot be grounded in OCR output.

---

# 8. LLM

## Provider

**Groq API**

The LLM is hosted remotely.

Do not use:

- Ollama;
- Qwen local inference;
- local GGUF models;
- local GPU inference.

## Uses

Groq is used for:

### Document Intelligence

- semantic extraction from OCR text;
- normalization of messy field labels;
- structured JSON generation.

### Eligibility Copilot

- interpreting user-provided information;
- identifying missing information;
- generating explanations;
- producing bilingual explanations;
- identifying relevant rule IDs.

### Form Readiness Kit

- interpreting field descriptions;
- simplifying legal/technical wording;
- generating field-specific explanations;
- identifying what information is required.

The LLM must not be the final authority for eligibility.

---

# 9. Groq Configuration

Backend environment variables:

```env
GROQ_API_KEY=
GROQ_LLM_MODEL=
GROQ_STT_MODEL=whisper-large-v3-turbo
```

The exact LLM model should be configurable through environment variables rather than hardcoded.

The backend should expose a shared Groq client/service:

```text
backend/app/services/ai/groq.py
```

Modules should call this shared service instead of creating their own API clients.

---

# 10. Speech-to-Text

## Provider

**Groq Speech-to-Text**

## Model

```text
whisper-large-v3-turbo
```

Used for:

- English speech;
- Hindi speech;
- voice questions;
- conversational assistant input.

Pipeline:

```text
Microphone
    ↓
React
    ↓
FastAPI
    ↓
Groq STT
    ↓
Text
    ↓
Assistant / relevant module
```

Voice input must always have a typed-input fallback.

If STT fails or is unavailable, the user must still be able to continue.

---

# 11. Text-to-Speech

## Provider

**Google Gemini API**

Gemini TTS is used for:

- English spoken responses;
- Hindi spoken responses;
- voice-guided explanations;
- conversational assistant responses.

Pipeline:

```text
Assistant response
       ↓
FastAPI
       ↓
Gemini TTS
       ↓
Audio
       ↓
React audio playback
```

Backend configuration:

```env
GEMINI_API_KEY=
GEMINI_TTS_MODEL=
```

The model must be configurable through the environment rather than hardcoded.

---

# 12. Conversational Assistant

The voice assistant is a **cross-cutting capability**, not a fourth mandatory backend module.

It interacts with the three core modules.

Example:

```text
User:
"What does this field mean?"

        ↓

Assistant identifies current form field

        ↓

Form Readiness Kit provides field context

        ↓

Groq generates simple explanation

        ↓

Gemini TTS speaks explanation in Hindi/English
```

The assistant must be capable of:

- understanding the current application context;
- explaining terminology;
- answering questions;
- asking for missing information;
- guiding the user through fields;
- switching between English and Hindi;
- accepting voice or typed input.

The assistant must not invent eligibility requirements or official government rules.

---

# 13. Firebase

Firebase is used for application management and persistence.

## Firebase Authentication

Use Firebase Authentication for:

- account creation;
- login;
- Google authentication if enabled;
- authenticated user identity;
- preferred language.

A guest/demo path should remain available if authentication becomes a presentation risk.

## Cloud Firestore

Use Firestore for:

- user profiles;
- confirmed extracted information;
- document metadata;
- document vault metadata;
- saved applications;
- application/form state;
- reminders;
- user language preference.

## Firebase Storage

Use Firebase Storage for:

- uploaded PDFs;
- uploaded images;
- saved supporting documents;
- generated document artifacts where required.

Sensitive document data should not be unnecessarily duplicated between Firestore and Storage.

Store metadata in Firestore and files in Storage.

---

# 14. Firebase Frontend Configuration

The React application may contain the Firebase web configuration:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

These values are Firebase client configuration values.

Do not place:

- Groq secret keys;
- Gemini secret keys;
- Firebase Admin credentials;

in frontend environment variables.

---

# 15. Three Sellable Modules

## Module 1 — Document Intelligence

### Responsibility

Convert uploaded documents into verified, structured information.

### Input

```text
PDF
Image
Document metadata
```

### Output

```text
OCR text
Detected fields
Evidence
Confidence
Document metadata
```

### Primary endpoint

```http
POST /v1/documents/extract
```

### Reuse

This module is intentionally reusable.

It can be used for:

```text
Profile creation
        ↓
Document Intelligence

Form preparation
        ↓
Document Intelligence

Missing eligibility information
        ↓
Document Intelligence
```

The same module must not assume it is being used only during onboarding.

---

# 16. Module 2 — Eligibility Copilot

### Responsibility

Determine whether a user appears to satisfy a scheme's explicitly defined criteria and explain what information is missing.

### Input

```text
Confirmed user profile
Selected scheme
Versioned scheme rules
```

### Output

```text
likely_match
needs_information
not_a_match
```

plus:

- criterion-by-criterion evaluation;
- missing fields;
- required documents;
- rule IDs;
- explanation;
- next actions;
- disclaimer.

### Primary endpoint

```http
POST /v1/eligibility/evaluate
```

### Scheme discovery

```http
GET /v1/eligibility/schemes
```

### Architecture

```text
Confirmed Profile
       ↓
Groq LLM
       ↓
Interpretation / missing information
       ↓
Deterministic Rule Evaluator
       ↓
Validated Result
       ↓
Bilingual Explanation
```

The deterministic evaluator always has the final authority.

---

# 17. Eligibility Rules

Rules must be represented as readable, versioned JSON.

Example:

```json
{
  "id": "scheme-001",
  "version": "1.0",
  "criteria": {
    "age": {
      "minimum": 18
    },
    "annualIncome": {
      "maximum": 100000
    }
  },
  "requiredDocuments": [
    "identity_proof",
    "income_certificate"
  ]
}
```

Rules must be:

- readable;
- versioned;
- testable;
- deterministic;
- independent of LLM output.

The LLM may cite rule IDs, but the evaluator must verify them.

---

# 18. Module 3 — Form Readiness Kit

### Responsibility

Prepare the user to complete a form correctly.

This module is deliberately broader than simple "autofill."

It must support both:

### Digital/fillable forms

Where technically possible:

```text
User data
    ↓
Form field mapping
    ↓
Draft filled form
```

### Non-fillable/scanned/manual forms

The system cannot physically write on paper for the user.

Instead it generates:

```text
Field name
↓
What the field means
↓
Value to write
↓
Where/how to enter it
↓
Source of the value
```

### Primary endpoint

```http
POST /v1/forms/readiness
```

The module should produce a field-by-field completion plan.

Example:

```json
{
  "field": "Applicant's Full Name",
  "value": "Example User",
  "source": "confirmed_profile.fullName",
  "help": "Enter your name exactly as it appears on your identity document."
}
```

---

# 19. Form Field Guidance

Every field should support:

- field name;
- expected value;
- source;
- required/optional status;
- missing status;
- plain-language explanation;
- confidence/provenance where applicable.

The UI should provide an information icon:

```text
[ Applicant's annual income ]   ⓘ
```

Selecting the icon displays a simple explanation.

---

# 20. Translation / Language

Supported languages for the first version:

```text
English
Hindi
```

The language preference should affect:

- application UI;
- form explanations;
- eligibility explanations;
- assistant responses;
- voice input/output where supported.

Users must be able to switch languages manually.

Do not assume an AI-generated translation is always correct.

The user must be able to switch between Hindi and English when a translation is unclear.

---

# 21. Form Translation

If a form is provided in English:

```text
English form
     ↓
Field interpretation
     ↓
Hindi explanation/labels
```

The original field should remain available.

The translated version must not silently replace the source text in situations where legal meaning could change.

---

# 22. Document Vault

The document vault uses:

```text
Firebase Storage
+
Firestore metadata
```

Store:

- document name;
- document type;
- upload date;
- expiry date if known;
- source;
- associated application;
- user-defined metadata.

Example:

```text
Income Certificate
Uploaded: 21 Aug 2026
Expires: 21 Aug 2027
Used for: Scheme A
```

The vault should allow the user to reuse a previously confirmed document instead of uploading it again.

---

# 23. Attention / Reminder System

A full application-status tracker is **not required for the first version**.

The first version may support document/application attention items such as:

```text
Document expiring soon
Missing required document
Information needs confirmation
Application draft incomplete
```

A scheduled check can later be added.

Do not implement third-party website scraping unless time remains after the primary flow is complete.

---

# 24. Document Verification / Scam Detection

This is a **stretch feature only**.

Do not claim:

```text
"This document is genuine."
"This document is fake."
```

unless there is a legitimate verification authority/API.

Instead implement:

### Document Quality & Risk Flags

Possible outputs:

```text
Image quality too low
Required field missing
Conflicting values detected
Unexpected formatting
Identifier format appears invalid
Document appears incomplete
```

This should be described as a **risk/quality assessment**, not legal authenticity verification.

---

# 25. Optional Web Research

A live web-research layer may be added later for:

- locating official scheme websites;
- finding current eligibility information;
- identifying official forms;
- finding official documentation.

It must not be required for the core demo.

If implemented, prefer official sources and preserve the source URL/date in the result.

The system should distinguish:

```text
Official verified rule
vs.
AI interpretation
vs.
User-provided information
```

Do not allow live web results to silently overwrite curated rules.

---

# 26. Main Application Flow

The integrated application should follow:

```text
Login
  ↓
Choose language
  ↓
Home
  ↓
Choose form/application
  ↓
Understand eligibility
  ↓
Eligibility evaluation
  ↓
Ask only for missing information
  ↓
Upload supporting documents if required
  ↓
Document Intelligence
  ↓
User confirms extracted information
  ↓
Profile/application data updated
  ↓
Form Readiness Kit
  ↓
Field-by-field completion guidance
  ↓
Optional digital form draft
  ↓
Bilingual voice/text assistant
  ↓
Save useful documents to vault
```

The user should not be forced through unnecessary screens.

---

# 27. Shared Backend Services

Use shared services rather than duplicating integrations.

Recommended structure:

```text
backend/
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── documents.py
│   │   ├── eligibility.py
│   │   ├── forms.py
│   │   └── assistant.py
│   │
│   ├── modules/
│   │   ├── document_intelligence/
│   │   ├── eligibility/
│   │   └── form_readiness/
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── groq.py
│   │   │   └── gemini.py
│   │   ├── ocr/
│   │   │   └── paddleocr.py
│   │   ├── firebase/
│   │   │   └── firebase.py
│   │   └── documents/
│   │
│   ├── schemas/
│   ├── rules/
│   └── utils/
│
└── tests/
```

---

# 28. API Boundaries

The main application communicates with modules through stable API contracts.

Required module APIs:

```http
POST /v1/documents/extract
POST /v1/eligibility/evaluate
GET  /v1/eligibility/schemes
POST /v1/forms/readiness
POST /v1/assistant/message
POST /v1/assistant/transcribe
POST /v1/assistant/speak
```

The assistant endpoints may internally call the other modules depending on context.

---

# 29. Environment Variables

## Frontend `.env`

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Backend `.env`

```env
GROQ_API_KEY=
GROQ_LLM_MODEL=
GROQ_STT_MODEL=whisper-large-v3-turbo

GEMINI_API_KEY=
GEMINI_TTS_MODEL=

FIREBASE_PROJECT_ID=
```

Never commit `.env`.

Provide:

```text
.env.example
```

with empty values and descriptions.

---

# 30. Dependencies

The exact dependency list should be kept minimal.

### Frontend

```text
react
react-dom
typescript
vite
tailwindcss
lucide-react
firebase
```

Add other packages only when a real requirement exists.

### Backend

Core:

```text
fastapi
uvicorn
pydantic
python-dotenv
```

Document processing:

```text
paddleocr
pymupdf
pillow
```

AI:

```text
groq
google-genai
```

Firebase/server integration should use the official Firebase Admin tooling only where server-side Firebase access is required.

---

# 31. Testing

Every module must have backend tests.

## Document Intelligence

Test:

- successful OCR;
- Hindi OCR;
- English OCR;
- malformed files;
- unsupported file types;
- missing fields;
- invalid extracted values;
- hallucinated LLM fields;
- OCR evidence mismatch.

## Eligibility

Test:

- positive eligibility;
- negative eligibility;
- missing information;
- age boundaries;
- income boundaries;
- invalid profile values;
- invalid rule IDs;
- LLM/deterministic disagreement;
- LLM unavailable.

## Form Readiness

Test:

- complete profile;
- partially complete profile;
- missing required fields;
- digital/fillable field mapping;
- manual/scanned form guidance;
- incorrect field mappings.

## Assistant

Test:

- English text;
- Hindi text;
- STT failure;
- TTS failure;
- module-context questions;
- fallback to text interaction.

---

# 32. AI Failure Handling

AI services are external dependencies and can fail.

Every AI integration must have graceful fallback behavior.

### Groq unavailable

The system should:

- continue OCR;
- use deterministic extraction where available;
- continue deterministic eligibility evaluation;
- display a clear fallback state;
- never crash the entire application.

### Gemini unavailable

The system should:

- display the generated text;
- allow typed interaction;
- disable only voice playback.

### STT unavailable

The system should:

- retain typed input;
- display a microphone error;
- allow the user to continue.

AI failure must never destroy the user's confirmed data.

---

# 33. Security

Never:

- hardcode API keys;
- commit `.env`;
- expose Groq/Gemini secrets to React;
- log raw sensitive documents;
- log full identity numbers unnecessarily;
- trust LLM-generated identity information without evidence;
- allow the LLM to make unvalidated eligibility decisions.

Sensitive values should be masked where appropriate.

Example:

```text
XXXX XXXX 1234
```

rather than displaying a full identity number unnecessarily.

---

# 34. Development Tools

The project may use:

- **Stitch** for UI generation/design exploration.
- **Firebase MCP** for Firebase-related development workflows.
- **Sequential Thinking MCP** for structured reasoning during development.
- **Antigravity** for implementation and repository-level coding.

These tools are development-time tooling and are not runtime dependencies of the application.

---

# 35. Deployment

For the hackathon, deployment should remain simple.

Recommended:

```text
Frontend → Vercel / Firebase Hosting
Backend  → simple Python-compatible hosting
Database → Firebase
Storage  → Firebase Storage
AI       → Groq + Gemini APIs
```

Do not introduce container orchestration unless deployment requirements force it.

---

# 36. Module Separation Rule

The application is one product, but each module must be independently understandable.

Each module must have:

```text
Clear responsibility
Clear input schema
Clear output schema
Stable API endpoint
Independent tests
README documentation
Synthetic sample data
No dependency on frontend implementation
```

The main application may compose them:

```text
Document Intelligence
        ↓
Confirmed Profile
        ↓
Eligibility Copilot
        ↓
Eligible / Missing Information
        ↓
Form Readiness Kit
```

But any module can also be consumed independently by another application.

---

# 37. What Is Explicitly Out of Scope

For the first hackathon implementation:

- Local LLM inference.
- Ollama.
- Local Whisper.
- Local TTS.
- Kubernetes.
- Redis.
- PostgreSQL unless genuinely required.
- Full third-party application-status automation.
- Automatic government-site submission.
- Guaranteed document authenticity detection.
- Production-grade compliance infrastructure.
- Complex background job infrastructure.
- Multi-region deployment.

These may be considered after the core experience works.

---

# 38. Priority Order

With limited hackathon time, implementation priority is:

```text
P0
├── Main user journey
├── Firebase authentication
├── Document upload
├── OCR + extraction
├── User confirmation
├── Eligibility evaluation
├── Form readiness
└── English/Hindi UI

P1
├── Groq conversational assistant
├── Groq STT
├── Gemini TTS
└── Document vault

P2
├── Document expiry reminders
├── Live official-source research
└── Digital PDF autofill improvements

P3
├── Application status tracking
└── Document quality/risk flags
```

The hackathon demo must remain fully usable if every P2/P3 feature is removed.

---

# 39. Core Architectural Summary

```text
                         PAPERWORK & ACCESS
                                │
                ┌───────────────┴────────────────┐
                │                                │
           React + Vite                    FastAPI + Python
                │                                │
                │             ┌──────────────────┼──────────────────┐
                │             │                  │                  │
                │             ↓                  ↓                  ↓
                │      Document Intelligence  Eligibility      Form Readiness
                │             │               Copilot              Kit
                │             │                  │                  │
                │             ↓                  ↓                  ↓
                │         PaddleOCR          Groq LLM            Groq LLM
                │         PyMuPDF            + Rules              + Rules
                │             │                  │                  │
                └─────────────┴──────────────────┴──────────────────┘
                                      │
                              Shared AI Services
                              ┌────────┴────────┐
                              ↓                 ↓
                           Groq STT          Gemini TTS
                              │                 │
                              └────────┬────────┘
                                       ↓
                              Bilingual Assistant

                         Firebase
                    ┌────────┼─────────┐
                    ↓        ↓         ↓
                   Auth   Firestore  Storage
```

**Final stack:**

```text
Frontend:
  React + TypeScript + Vite + Tailwind + Lucide

Backend:
  Python + FastAPI + Pydantic + Uvicorn

Documents:
  PaddleOCR + PyMuPDF + Pillow

AI:
  Groq LLM
  Groq Whisper STT
  Gemini TTS

Backend data:
  Firebase Auth
  Firestore
  Firebase Storage

Design/development:
  Stitch
  Antigravity
  Firebase MCP
  Sequential Thinking MCP
```

This is the stack to implement. Keep the module boundaries in the code and API contracts, but **do not turn the hackathon into a distributed-systems dissertation**. The integrated user journey is the product; the three module boundaries are what make that product separately sellable.