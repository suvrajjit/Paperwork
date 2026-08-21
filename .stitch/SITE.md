# Paperwork & Access - Product Constitution

## 1. Core identity

- **Project name:** Paperwork & Access
- **Stitch project ID:** 14875982353154175012
- **Mission:** Help a citizen understand a form, verify whether they may be eligible, collect the right information/documents, and complete the form with confidence in English or Hindi.
- **Primary users:** People with limited digital literacy; Hindi/English speakers; community volunteers helping applicants.
- **Voice:** Reassuring, plain-spoken, non-judgmental, trustworthy, concise.
- **Safety position:** The product gives guidance, not legal advice or an official eligibility decision. It must never claim that a document is genuine or that an application will be accepted.

## 2. Product thesis

The product is not an OCR tool, a translation tool, or a chatbot in isolation. Its value is the connected journey:

`Choose a form or official link -> understand it -> check likely eligibility -> gather/confirm required facts -> fill or prepare every field -> save useful documents -> understand the next action.`

One module can be reused at more than one point in that journey. For example, Document Intelligence is used both to create a reusable citizen profile and again when a particular form asks for a supporting document.

## 3. Time-boxed hackathon scope

### The single demo story (must work)

Use one synthetic example form/scheme and demonstrate this end-to-end:

1. User signs in or continues as a demo guest, then chooses English or Hindi.
2. User selects a form, uploads a PDF/image, or supplies one supported official URL.
3. The app shows the original form and a clear translated/simple-language view. The user can always toggle back to the original English label/text.
4. The voice/type assistant explains the form and asks only for details needed for the next step.
5. The app shows transparent eligibility criteria before collecting every document; it asks for missing facts/documents only when required.
6. The user uploads a synthetic supporting document. Document Intelligence extracts fields; the user reviews and confirms them.
7. The app produces a field-by-field completion plan. For a fillable digital form, it prepares a draft; for an image/manual form, it shows exactly what the user should write in every field.
8. The user may save the confirmed document to their demo vault and sees the next action.

### Explicitly out of scope for the first 10-hour version

- Real submission to a government portal.
- Scraping/logging into arbitrary third-party portals.
- A universal form parser for every form in India.
- Automatic application-status tracking across third-party websites.
- A claim that a document is genuine/fake, legally valid, or fraud-free.
- Background weekly notification jobs. Show an in-app reminder/demo notification instead.

## 4. Main app vs tradable modules

The main app owns authentication, language preference, navigation, the complete user journey, and document-vault metadata. It calls the modules via documented APIs.

| Tradable module | Main-app role | Standalone API | Reuse in the journey |
|---|---|---|---|
| Document Intelligence | Extract/confirm fields from supporting documents | `POST /v1/documents/extract` | Profile creation and form-specific evidence collection |
| Eligibility Copilot | Evaluate a confirmed profile against readable rules | `POST /v1/eligibility/evaluate` | Before requesting documents and before form preparation |
| Form Readiness Kit | Convert a chosen form + confirmed profile into field guidance, prefill values, missing-data checklist | `POST /v1/forms/prepare` | Primary completion experience |

The Bilingual Explainer is part of the main experience and a valuable fourth sellable module if time permits:

`POST /v1/explain`

It accepts approved/form text plus `en` or `hi`, then returns simple-language explanations, translations, and next steps. It must keep the original text accessible and label generated translations as guidance.

## 5. AI and data boundaries

- **OCR:** PaddleOCR/PyMuPDF reads uploaded images/PDFs.
- **Structured extraction:** Groq returns schema-bound fields from OCR text. The backend validates every field against OCR evidence, formats, and user confirmation.
- **Eligibility:** Groq may interpret free-text answers and write bilingual explanations. Versioned JSON rules and deterministic checks validate the final result.
- **Speech-to-text:** Groq Whisper for short English/Hindi microphone input.
- **Text-to-speech:** Gemini TTS for short English/Hindi assistant answers.
- **Translation:** Gemini/Groq may create a translation/simple explanation, but original wording is always available via a toggle.
- **Research:** For the demo, accept a user-provided official URL or use curated synthetic/official-source content. Do not promise that a search tool finds every legal exception or rejection loophole. Any research-derived statement must show its official source URL and be marked as informational.
- **Documents:** Use only synthetic data for the demo. Do not expose API keys in the frontend. Do not send real government documents to third-party APIs in the demo.

## 6. Visual language

- **Primary vibe:** Calm public-service clarity
- **Secondary vibe:** Warm human guidance
- **Tertiary vibe:** Modern, credible document workspace
- **Design direction:** Large readable typography, generous spacing, high contrast, clear progress states, one primary action per screen, friendly but not childish icons.
- **Language direction:** English and Hindi must be equally supported; prevent overflow for Devanagari text; never use language flags as the only language selector.
- **Accessibility:** Keyboard support, strong focus states, labelled icons, readable error text, no reliance on colour alone, written equivalent for every voice response.

## 7. Architecture and file structure

```text
paperwork-access/
├─ frontend/                         # React + TypeScript + Vite
│  └─ src/features/
│     ├─ onboarding/
│     ├─ form-assistant/
│     ├─ document-vault/
│     ├─ eligibility/
│     └─ bilingual-guide/
├─ backend/                          # FastAPI; keys stay here
│  ├─ app/orchestrator/              # complete user journey
│  └─ modules/
│     ├─ document-intelligence/      # independently runnable/sellable
│     ├─ eligibility-copilot/        # independently runnable/sellable
│     ├─ form-readiness-kit/         # independently runnable/sellable
│     └─ bilingual-explainer/        # stretch standalone module
├─ firebase/                         # auth, Firestore rules/config
├─ .stitch/
│  ├─ SITE.md
│  └─ DESIGN.md
└─ docs/
```

Firebase is for authentication, user preferences, vault metadata, and demo reminders. Store no API keys in Firebase client configuration. A guest-demo path is acceptable if Firebase authentication blocks progress.

## 8. Live sitemap

- [ ] `index` - welcome, language choice, sign in / demo guest
- [ ] `dashboard` - choose “Understand a form” or “Prepare a form”; vault/reminder summary
- [ ] `form-workspace` - original form preview, Hindi/English toggle, simple explanation, voice/type guide
- [ ] `eligibility-check` - transparent criteria, reasons, missing facts/documents
- [ ] `document-review` - upload, OCR extraction, user confirmation, save-to-vault choice
- [ ] `form-readiness` - each field, value/source, missing data, manual-writing guidance or draft export
- [ ] `document-vault` - saved demo documents, metadata, expiry/action cards

## 9. Roadmap

### High priority - build first

- Fresh React/FastAPI project scaffold with secure backend environment variables.
- English/Hindi preference and original/translated-text toggle.
- One complete synthetic form/scheme demo flow.
- Document Intelligence API integration and confirmed-profile hand-off.
- Eligibility Engine API integration with transparent criteria and missing-data questions.
- Form Readiness Kit: field-by-field guidance, prefilled values, and checklist.
- Typed assistant with optional short voice input/output.

### Medium priority - only after the core flow works

- Firebase Authentication and Firestore-backed preferences/vault metadata.
- Save-to-vault choice after document review.
- PDF AcroForm prefill for one supported fillable PDF template.
- In-app expiry/action reminder cards.
- Standalone module playgrounds and 30-45 second demo recordings.

### Low priority / stretch

- Bilingual Explainer as a fourth standalone API.
- User-provided official URL research with visible source citations.
- Browser notification permission and scheduled reminders.
- Manual status updates/timeline.
- Document quality/tampering **risk flags** (never a genuine/fake verdict).

## 10. Creative freedom guidelines

- Prefer a polished, explainable happy path over broad but unreliable coverage.
- Every AI output needs a visible source, review, correction, or disclaimer as appropriate.
- Avoid generic chatbot screens. The guide should be embedded beside the specific form/field the user is currently working on.
- Do not create a fake government affiliation or use official logos in a misleading way.
- For any unknown form, gracefully fall back to “I can help you understand and prepare fields; please verify with the official portal.”
