# Product Requirements Document (PRD)

## SG Resume Enhancer

**Product type:** Desktop application  
**Platform:** Cross-platform (macOS, Windows, Linux) via **Electron.js**  
**Document version:** 1.0  
**Last updated:** 2026-05-12  

---

## 1. Vision & summary

**SG Resume Enhancer** helps people improve their résumés or CVs using AI while staying in control of their data. Users import an existing document, edit structured résumé content, apply professional HTML templates, and export polished **PDF** or **DOCX** files. Projects and all résumé data persist **locally** in **SQLite**; AI calls go to user-configurable providers, with **Ollama** as the sensible default for privacy-conscious and offline-capable workflows.

---

## 2. Goals

| Goal | Description |
|------|-------------|
| **Improve résumé quality** | AI-assisted rewriting, tightening, and tailoring while preserving factual accuracy (user remains responsible for truthfulness). |
| **Beautiful, simple UX** | A calm, modern interface that minimizes steps from “open app” to “exported file.” |
| **Local-first data** | Résumé projects and structured fields stored in SQLite on the user’s machine; no mandatory cloud storage for core data. |
| **Flexible AI** | Support multiple providers so users can choose local models (Ollama), unified APIs (OpenRouter), or hosted APIs (Google GenAI, OpenAI). |
| **Professional output** | Multiple HTML-based templates and reliable export to PDF and DOCX. |

---

## 3. Non-goals (initial release)

- Hosted sync, team collaboration, or multi-user accounts.
- Automatic job application submission or scraping job boards.
- Guaranteed ATS pass rates or legal/compliance certification (the app may *assist* with ATS-friendly structure but does not certify outcomes).
- Mobile or web versions (desktop Electron only unless explicitly expanded later).

---

## 4. Target users

- **Job seekers** updating an existing CV quickly.
- **Career switchers** who need help reframing experience for a new role.
- **Privacy-focused users** who prefer **Ollama** / local inference when possible.

---

## 5. Core user journeys

1. **Create or open a project** → Import PDF/DOCX/TXT (see §7.2) or start blank structured résumé.
2. **Edit structured data** → Sections (e.g., summary, experience, education, skills) with clear forms; optional rich text where needed.
3. **Choose template** → Preview HTML template with live data binding.
4. **Enhance with AI** → Select scope (section, bullet list, full draft assist), run enhancement, review diff or suggested replacement.
5. **Export** → PDF and/or DOCX saved to user-chosen path.

---

## 6. Information architecture & navigation

### 6.1 Top-level tabs

The main window uses **two persistent tabs** at the top:

| Tab | Purpose |
|-----|---------|
| **Resumes** | List of résumé projects; create, open, edit, template selection, AI enhancement actions, export. |
| **AI Settings** | Configure AI providers, models, API keys (where applicable), and defaults. |

### 6.2 Resumes tab — suggested sub-structure

- **Project list:** Cards or rows with project name, last modified, optional thumbnail/preview.
- **Project workspace** (when a project is selected):
  - Structured editor for résumé sections.
  - Template gallery + live preview (HTML rendered in-app).
  - Actions: **Enhance with AI**, **Export PDF**, **Export DOCX**, **Duplicate project**, **Delete project**.

### 6.3 AI Settings tab

- **Default provider:** Pre-selected **Ollama** on first launch (with clear setup hints if not installed/running).
- **Provider panels:** Ollama, OpenRouter, Google GenAI, OpenAI — each with connection fields appropriate to that provider.
- **Global defaults:** Default model per provider, temperature (if exposed), optional system prompt prefix for résumé tone (professional, concise, etc.).
- **Security UX:** Mask API keys; store secrets using OS-level secure storage where feasible (Electron `safeStorage` or equivalent); never log keys.

---

## 7. Functional requirements

### 7.1 Résumé projects (SQLite)

- Create, rename, duplicate, delete projects.
- Persist all structured résumé fields required for templates (schema to be defined in implementation; must support common sections and ordering).
- Track metadata: `id`, `name`, `created_at`, `updated_at`, `selected_template_id`, optional `notes`.
- Store **version or undo** as a stretch goal; minimum viable is **last-write-wins** with explicit user confirmation on destructive actions.

### 7.2 Import

- Support importing from common formats where technically feasible in v1 (prioritize **PDF**, **DOCX**, **TXT/Markdown**).
- Import flow must communicate limitations (e.g., complex PDF layouts may not map perfectly to structured fields).
- User can correct parsed content after import.

### 7.3 Templates (HTML)

- Ship with **multiple built-in HTML templates** (responsive, print-oriented CSS).
- Templates consume a **single structured data model** (JSON or normalized tables projected to a render context).
- User can switch templates without losing data.
- Optional “custom template” path is a future enhancement unless scoped into v1.

### 7.4 Export

| Format | Requirement |
|--------|--------------|
| **PDF** | Generated from HTML + CSS (print stylesheet). Use a well-supported approach (e.g., headless Chromium / Playwright / `electron`-compatible printing pipeline, or maintained HTML→PDF libraries). Output must respect page breaks and margins for typical résumé length (1–2 pages target). |
| **DOCX** | Export structured content into a professional `.docx` (library-based generation from structured data; HTML→DOCX mapping may be partial — prioritize readable Word documents over pixel-perfect match to HTML preview). |

### 7.5 AI enhancement

- **Invocation contexts:** Selected section, selected bullets, or whole document assist (with safeguards against runaway token use).
- **Guardrails (product-level):** Pre-enhancement reminder that AI suggestions must be fact-checked; optional checkbox “do not invent metrics or employers.”
- **Provider routing:** All requests use the **currently selected default provider** in AI Settings unless the user overrides per action (optional advanced control).
- **Errors:** Clear messages for unreachable Ollama host, invalid API key, rate limits, and model not found.

---

## 8. AI providers

| Provider | Default? | Typical configuration |
|----------|----------|----------------------|
| **Ollama** | **Yes** | Base URL (e.g., `http://localhost:11434`), model name, optional timeouts. |
| **OpenRouter** | No | API key, base URL (if custom), model id. |
| **Google GenAI** | No | API key or OAuth per Google’s SDK constraints; model selection. |
| **OpenAI** | No | API key; organization/project IDs if needed; model selection. |

**Requirements:**

- User can switch default provider; app persists choice locally.
- Connection **test** action per provider (“Ping” / “Send minimal completion”) with success/failure feedback.
- Document rate limits and costs for cloud providers in UI copy (non-binding reminders).

---

## 9. Non-functional requirements

| Area | Requirement |
|------|-------------|
| **Privacy** | Résumé content stays local in SQLite; cloud AI providers receive only what the user sends when they trigger enhancement (no silent bulk upload). |
| **Performance** | UI remains responsive; long AI calls show progress/cancel where supported. |
| **Reliability** | Autosave structured edits (debounced); crash recovery should not lose last saved state. |
| **Accessibility** | Keyboard navigable primary flows; sufficient contrast; scalable typography. |
| **Updates** | Electron auto-update strategy TBD (e.g., `electron-updater`) — document in technical design. |
| **Licensing** | Bundle template and dependency licenses transparently (About screen). |

---

## 10. UI/UX principles

- **Clarity first:** One primary action per screen region; avoid clutter.
- **Beautiful but restrained:** Consistent spacing, typography scale, subtle motion; avoid noisy gradients or gimmicks.
- **Trust:** Explicit preview before destructive actions; visible save/export feedback.
- **Empty states:** Friendly guidance when there are no projects yet or Ollama is not reachable.

*Visual direction (illustrative only):* neutral or soft accent palette, ample whitespace, strong hierarchy for section headings in the editor.

---

## 11. Data model (high-level)

SQLite tables (conceptual):

- **`projects`** — project metadata and foreign keys.
- **`resume_sections`** — section type, sort order, body (JSON or text fields per section strategy).
- **`settings`** — key/value for app preferences including encrypted provider secrets references.
- **`templates`** — optional if templates are DB-backed; otherwise templates ship as files with IDs in `projects`.

Exact schema is an implementation detail but must support querying all projects for the Resumes list and loading a full résumé graph for rendering and export.

---

## 12. Technical notes (implementation-facing)

- **Electron:** Main vs renderer boundaries; IPC for DB access and safe file dialogs; avoid exposing raw Node APIs to untrusted renderer if loading web content — templates render in a controlled context.
- **SQLite:** Use a maintained driver (`better-sqlite3` or similar); migrations for schema evolution.
- **HTML → PDF:** Prefer solutions that honor CSS `@media print` and pagination; validate with multi-page résumés.
- **DOCX:** Prefer generating from structured data over naive HTML paste unless HTML→DOCX quality is validated.

---

## 13. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| AI hallucinates achievements | UX warnings; editable diff; optional “conservative” prompt mode. |
| PDF layout breaks on export | Template QA on export; page-break utilities in CSS; user margin controls (later). |
| Import quality varies | Transparent parsing limits; manual correction UI. |
| User confusion with API keys | Docs links; test connection; masked fields. |

---

## 14. Success metrics (product)

- **Activation:** User creates first project and completes one export.
- **Engagement:** Repeat edits + AI enhancements per project (healthy = purposeful use, not frustration retries).
- **Quality:** Low crash rate; export success rate.
- **Privacy alignment:** % of users staying on Ollama vs cloud (informational, not prescriptive).

---

## 15. Phased roadmap (suggested)

| Phase | Scope |
|-------|--------|
| **MVP** | Projects + SQLite; structured editor; 2–3 HTML templates; PDF export; Ollama + one cloud provider; AI Settings tab; import TXT/Markdown + basic DOCX/PDF import. |
| **v1.1** | DOCX polish; additional templates; OpenRouter + remaining providers parity; autosave robustness. |
| **v1.2** | Section-level AI presets (tone/role targeting); optional version history; advanced export options (margins, font scale). |

---

## 16. Open questions

- Minimum OS versions and code-signing/notarization expectations per platform.
- Whether offline AI is a hard requirement beyond Ollama (fully offline app vs online APIs).
- Localization scope (English-only vs multi-language UI and templates).
- Telemetry: crash-only vs anonymized usage (default posture should favor privacy).

---

## 17. Glossary

- **Résumé project:** A saved workspace containing structured résumé data, template choice, and metadata.
- **Template:** HTML/CSS layout that renders structured résumé data for preview and PDF export.
- **Provider:** AI backend used for enhancement (Ollama, OpenRouter, Google GenAI, OpenAI).

---

*End of PRD.*
