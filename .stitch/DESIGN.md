# Design System: Paperwork & Access

## 1. Visual theme and atmosphere

A calm, trustworthy public-service workspace with the warmth of a helpful guide rather than a government portal. Density is balanced (5/10): enough information for a form workflow, but every step has generous breathing room. Variance is restrained-but-human (5/10): asymmetric two-pane workspaces for form review, not decorative chaos. Motion is fluid and restrained (4/10): reinforce progress and confirmation without distracting a user who may already be anxious about paperwork.

The product should feel like a capable community worker sitting beside the user: clear, patient, respectful, and specific. Avoid both cold banking-app minimalism and clichéd “AI assistant” visual language.

## 2. Color palette and roles

- **Paper Canvas** (`#FAF7F0`) - primary warm off-white page background, reduces the harshness of document-heavy screens.
- **Clear Surface** (`#FFFFFF`) - raised panels, form fields, document preview background.
- **Ink** (`#20231F`) - primary text and high-contrast icons; never use pure black.
- **Quiet Olive** (`#5E6853`) - muted secondary text, inactive icons, descriptive metadata.
- **Divider Sand** (`#E7E1D6`) - structural borders, table lines, inactive field outlines.
- **Guidance Green** (`#2F6B56`) - the only accent; primary CTA, selected state, success/confirmed data, focus ring.
- **Review Amber** (`#A76119`) - review-needed indicators and caution copy; never use it as a primary CTA.
- **Error Brick** (`#A7443D`) - inline errors and destructive actions only.

Never use neon blue/purple, gradients, glows, or colour alone to communicate eligibility, progress, or errors.

## 3. Typography rules

- **Display and interface:** `Geist`, fallback `Arial`, sans-serif. Use weight and spacing for hierarchy, not oversized type.
- **Hindi and Devanagari:** `Noto Sans Devanagari`, fallback `Nirmala UI`, sans-serif. Test every screen at 16px minimum body size; provide 1.55 line-height for Hindi body text.
- **Body:** Geist/Noto Sans Devanagari, 16px desktop and mobile minimum, 1.5-1.65 leading, 65ch maximum readable line width.
- **Metadata and machine-readable values:** `Geist Mono`, 13-14px. Use only for file names, dates, API/demo labels, and field sources.
- **Heading scale:** 14px eyebrow, 18px section title, 24px page title, 36px welcome headline; scale via `clamp()` on mobile.
- **Banned:** Inter, generic serif fonts, thin low-contrast text, all-caps paragraphs, and unexplained jargon.

## 4. Screen and component system

### Global navigation

- Desktop: a restrained top bar with product mark, language switch, vault entry, and profile/demo-guest menu.
- Mobile: compact header, language switch visible without opening a menu, bottom progression indicator only on form-workspace screens.
- Show current language as text (`English`, `हिंदी`), never a flag alone.

### Welcome and language selection

- Left-aligned two-column introduction on desktop; content stacks on mobile.
- The language choice is large, textual, and immediately previews a sample sentence.
- Use one primary CTA: `Continue`.

### Form workspace

- Desktop uses an asymmetric 42/58 split: form/document preview on the left, assistant and field guidance on the right.
- The original/translated toggle sits directly above the explanation, never hidden in settings.
- On mobile, show a segmented switch: `Form` / `Guidance`, preserving the user’s current field position.
- Highlight the active form field with a 2px Guidance Green outline and a matching guidance row; do not cover the document with a floating chatbot.

### Eligibility criteria

- Use a vertical criterion list with clear icon + written state: `Met`, `Needs information`, `Does not match`.
- Each result includes an expandable “Why am I seeing this?” section with its rule/source.
- Use border-top dividers instead of a grid of equal cards.
- Always show the guidance-only disclaimer in a quiet but visible inline note.

### Document review

- Use a structured two-column view: upload/document preview and extracted-field review.
- Fields are grouped by identity, address, and supporting evidence.
- Every field has its source/evidence access, confidence/review state, edit control, and masking control where necessary.
- Never show full sensitive identifiers by default.

### Form readiness kit

- Present a sequential, numbered field plan rather than a dense generic table.
- Each row includes: field name, proposed value or `Needed`, a small information control explaining it, source badge (`From document`, `You entered this`, `Still needed`), and a completion state.
- Manual/scanned forms use a callout: `Write this in the form`, followed by the exact confirmed value.
- Fillable-form exports are labelled `Draft - review before use`.

### Bilingual guide and voice

- Assistant messages are short, grounded in the active context, and always accompanied by visible text.
- Voice control is a 44px minimum tap target with label `Speak` / `बोलें`; use an active waveform line, not a pulsing orb.
- On failure, show a quiet inline fallback: `Voice is unavailable. You can continue by typing.`

### Vault and reminders

- The vault is a simple document list with type, saved date, optional expiry/action date, and one next action.
- Do not show invented activity metrics, risk scores, or fake verification labels.

## 5. Layout principles

- Maximum content width: 1280px with 24px desktop side padding and 16px mobile padding.
- Use CSS Grid for two-pane and field layouts. Collapse every multi-column view to one column below 768px.
- Standard spacing rhythm: 4, 8, 12, 16, 24, 32, 48px.
- Buttons and interactive controls are at least 44px tall.
- Labels sit above inputs; helper/error text sits below. Never use placeholder text as the only label.
- One primary action per screen. Secondary actions are outline or text buttons.
- No overlapping content, absolute-positioned chat layers, horizontal mobile scrolling, or three-equal-card feature rows.

## 6. Motion and interaction

- Use 160-220ms ease-out transitions for state changes; use `transform` and `opacity` only.
- Buttons move down 1px on press; no outer glows.
- Loading states are skeletons matching the final document/field layout, not circular spinners.
- Reveal extracted fields and checklist items with a 40ms stagger only once after processing.
- Use subtle progress transitions when a field becomes confirmed; do not use celebration confetti.
- Respect `prefers-reduced-motion` by disabling non-essential animation.

## 7. Content rules

- Prefer concrete, task-centred language: `Upload income certificate`, `Check what is missing`, `Review this field`.
- Do not use AI marketing copy, promises, invented success percentages, or fake government-verification language.
- Use `may qualify`, `based on the information provided`, and `please verify on the official portal` where appropriate.
- Keep assistant messages to one action/question at a time.
- Hindi translations must use natural Devanagari. Keep original source text accessible when translation is generated.

## 8. Anti-patterns (banned)

- No emojis, no Inter, no pure black, no neon/glow, no gradients, no generic chatbot orb.
- No generic government seals, deceptive official branding, fake document verification stamps, or claims of legal certainty.
- No fabricated user names, analytics, risk scores, completion percentages, processing times, or system metrics.
- No three-column equal-card layouts, overlapping elements, low-contrast placeholder-heavy forms, or hidden language controls.
- No autogenerated legal advice or ungrounded “loopholes.”
