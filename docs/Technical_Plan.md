# Technical Implementation Plan

## SG Resume Enhancer

**Companion to:** [PRD.md](./PRD.md)
**Document version:** 1.0
**Last updated:** 2026-05-12

---

## 1. Purpose

This plan translates the PRD into a concrete engineering roadmap: technology choices, architecture, module boundaries, milestone-based delivery, and a tracking checklist. Per-task detail documents live in [`/tasks`](../tasks).

---

## 2. Technology stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Shell | **Electron** (latest LTS) | Mandated by PRD; cross-platform desktop with native shell + Chromium renderer. |
| Bundler / dev tooling | **electron-vite** | Fast HMR for both main and renderer, TypeScript-first, minimal config. |
| Renderer UI | **React 18 + TypeScript** | Mature ecosystem; team-friendly; works well with Vite. |
| Styling / components | **Tailwind CSS + shadcn/ui (Radix primitives)** | Accessible primitives + design tokens; supports the "calm, restrained" UX brief without bespoke design system work. |
| State (renderer) | **Zustand** + React Query | Small surface area; React Query handles IPC-as-async-source caching. |
| Routing | **react-router** (memory router) | Two top-level tabs + nested project workspace. |
| Database | **better-sqlite3** | Synchronous, fast, well-maintained; runs in main process only. |
| ORM / query | **Drizzle ORM** (sqlite dialect) | Type-safe schema + migrations; lighter than Prisma; no codegen daemon. |
| Validation | **Zod** | Validate IPC payloads, AI provider configs, imported résumé data. |
| Forms | **react-hook-form** + Zod resolver | Pairs with Zod schemas; handles the structured editor cleanly. |
| Secrets | **Electron `safeStorage`** | OS-native encryption (Keychain / DPAPI / libsecret) for API keys. |
| PDF export | **`webContents.printToPDF`** (Electron built-in) | No extra dependency; honors `@media print`; reuses bundled Chromium. |
| DOCX export | **`docx`** (npm) | Generates Word XML from structured data; better fidelity than HTML paste. |
| PDF import | **`pdfjs-dist`** | Pure JS; runs in main; extracts text + basic layout. |
| DOCX import | **`mammoth`** | Battle-tested DOCX → HTML/text. |
| AI SDKs | `ollama` (or fetch), `openai`, `@google/genai`, OpenRouter via OpenAI-compatible client | One adapter per provider behind a shared interface. |
| Auto-update | **electron-updater** (deferred to v1.1+) | Standard; integrates with GitHub Releases. |
| Logging | **electron-log** | File + console, ring-buffered, scrubs secrets. |
| Testing | **Vitest** (unit) + **Playwright** (E2E against packaged app) | Vitest matches Vite; Playwright drives Electron via `_electron`. |
| Packaging | **electron-builder** | Mature signing/notarization story per platform. |

### Why not...

- **Prisma**: requires a query engine binary per platform; adds packaging complexity vs Drizzle.
- **Puppeteer/Playwright for PDF export**: brings a second Chromium download; `printToPDF` already covers our needs.
- **html-docx-js**: HTML → DOCX fidelity is poor; we generate DOCX from the structured model instead (PRD §12).

---

## 3. Architecture

### 3.1 Process boundaries

```
┌────────────────────────────────────────────────────────────────┐
│ Main process (Node)                                            │
│   • Electron app lifecycle, windows, menus                     │
│   • SQLite (better-sqlite3) — single source of truth           │
│   • File dialogs, FS reads/writes                              │
│   • AI provider adapters (outbound HTTP)                       │
│   • Importers (pdfjs, mammoth) — CPU-heavy work runs here      │
│   • Exporters: PDF (hidden BrowserWindow + printToPDF), DOCX   │
│   • Secrets via safeStorage                                    │
└────────────────────────────────────────────────────────────────┘
                          ▲   IPC (typed channels)
                          │   contextBridge — no Node in renderer
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ Renderer process (Chromium, sandboxed)                         │
│   • React UI: Resumes tab, AI Settings tab                     │
│   • Live template preview (sandboxed iframe / srcdoc)          │
│   • No direct DB / FS / network for app data                   │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Security posture

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` for the main renderer.
- Renderer talks to main only through a small typed IPC surface exposed via `contextBridge.exposeInMainWorld('api', {...})`.
- Template HTML renders inside an `<iframe srcdoc>` or a separate `BrowserView` with its own sandbox. Templates can include CSS but no JS execution beyond what we ship.
- API keys never cross IPC in plaintext after first set; renderer references them by provider id, main resolves via `safeStorage`.

### 3.3 IPC surface (initial)

Grouped channels (handler names indicative):

- `projects.*` — list, get, create, rename, duplicate, delete, exportPdf, exportDocx
- `resume.*` — getSections, upsertSection, reorderSections
- `import.*` — fromPath, fromBuffer (returns parsed candidate structure)
- `templates.*` — list, getById, renderPreviewHtml
- `ai.*` — listProviders, getProviderConfig, setProviderConfig, testConnection, enhance, cancelEnhance
- `settings.*` — get, set
- `system.*` — pickSaveLocation, openExternal

Each handler validates input with Zod and returns `{ ok: true, data } | { ok: false, error }`. See [`tasks/03-ipc-architecture.md`](../tasks/03-ipc-architecture.md).

### 3.4 Folder layout

```
sg-resume-enhancer/
├── docs/
│   ├── PRD.md
│   └── Technical_Plan.md
├── tasks/                       # per-task design notes (this PR)
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # app entry, window mgmt
│   │   ├── ipc/                 # one file per channel group
│   │   ├── db/                  # drizzle schema, migrations, client
│   │   ├── ai/                  # provider adapters + registry
│   │   ├── import/              # pdf, docx, text/markdown
│   │   ├── export/              # pdf, docx
│   │   ├── templates/           # template loader, render context
│   │   └── secrets/             # safeStorage wrapper
│   ├── preload/
│   │   └── index.ts             # contextBridge typed API
│   ├── renderer/                # React app
│   │   ├── app/                 # router, layout, tabs
│   │   ├── features/
│   │   │   ├── resumes/         # list, workspace, editor
│   │   │   ├── templates/       # gallery + preview pane
│   │   │   ├── export/          # export dialog
│   │   │   ├── ai/              # enhance UI, diff view
│   │   │   └── settings/        # AI Settings tab
│   │   ├── components/ui/       # shadcn primitives
│   │   └── lib/                 # api client wrapping window.api
│   └── shared/                  # types & Zod schemas used by main + renderer
├── templates/                   # bundled HTML templates (resources)
├── electron-builder.yml
├── package.json
└── tsconfig.*.json
```

---

## 4. Data model

Conceptual SQLite schema (full DDL in [`tasks/02-database-schema.md`](../tasks/02-database-schema.md)):

- `projects` — `id`, `name`, `template_id`, `notes`, `created_at`, `updated_at`
- `resume_documents` — one row per project; stores normalized résumé JSON blob (`data` TEXT) plus extracted indexed fields (`full_name`, `headline`) for the list view
- `resume_sections` — *(optional v1.1)* normalized per-section rows if/when we need cross-project queries; MVP keeps everything in the JSON blob to ship faster
- `settings` — key/value
- `provider_configs` — `provider_id`, `enabled`, `base_url`, `default_model`, `extra_json` (key references live in `safeStorage`, not in DB)

Migrations are versioned SQL files under `src/main/db/migrations/`, applied on app startup.

The shared **résumé JSON shape** (Zod schema in `src/shared/resume.ts`) is the contract between editor, templates, and DOCX exporter. Treat it as the canonical model — templates do not invent fields.

---

## 5. Templates

- Templates are static HTML files with a tiny mustache-like placeholder syntax, plus a `manifest.json` per template (`id`, `name`, `thumbnail`, `supportedSections`).
- Rendering pipeline: `(resumeData, template) → renderedHtml`. The same renderer is used for live preview *and* PDF export — guarantees the export matches what the user sees.
- 3 templates ship in MVP: **Classic**, **Modern**, **Compact**.

Detail: [`tasks/05-templates-and-rendering.md`](../tasks/05-templates-and-rendering.md).

---

## 6. AI provider abstraction

```ts
interface AIProvider {
  id: 'ollama' | 'openrouter' | 'google' | 'openai';
  testConnection(): Promise<{ ok: boolean; message?: string }>;
  enhance(input: EnhanceRequest, signal: AbortSignal): AsyncIterable<EnhanceChunk>;
}
```

- Ollama is the default; the AI Settings tab pre-selects it on first launch and surfaces a "Is Ollama running?" status pill.
- Each provider has a small config record (base URL, model, key reference). Keys are written via `safeStorage.encryptString` and stored as base64 blobs in the `settings` table — never in plaintext, never logged.
- Streaming where the provider supports it; otherwise single-shot. Renderer renders chunks into the diff/preview view as they arrive.

Detail: [`tasks/08-ai-providers.md`](../tasks/08-ai-providers.md), [`tasks/09-ai-enhancement-flow.md`](../tasks/09-ai-enhancement-flow.md).

---

## 7. Export pipeline

- **PDF**: Render the chosen template into a hidden `BrowserWindow`, wait for `did-finish-load` + fonts ready, then `webContents.printToPDF({ printBackground: true, pageSize: 'Letter' | 'A4' })`. Save via dialog.
- **DOCX**: Map the résumé JSON model directly to `docx` library primitives (Paragraph, TextRun, Table). DO NOT try to convert template HTML to DOCX — it loses fidelity.

Detail: [`tasks/06-export-pipeline.md`](../tasks/06-export-pipeline.md).

---

## 8. Import pipeline

- **TXT / MD**: read file, run a lightweight heuristic parser, present as editable structured draft.
- **DOCX**: `mammoth.convertToHtml()` → DOM-walker → candidate structured fields.
- **PDF**: `pdfjs-dist` text extraction → heuristic section split (Summary / Experience / Education / Skills) → candidate fields. Always show the raw extracted text alongside parsed fields so users can correct.

Detail: [`tasks/07-import-pipeline.md`](../tasks/07-import-pipeline.md).

---

## 9. Non-functional implementation notes

- **Autosave**: debounce 800ms after edit; persist whole résumé JSON; status pill shows `Saving… / Saved`.
- **Crash recovery**: SQLite WAL mode; on launch, if a project has an in-memory draft newer than DB, prompt to restore.
- **Accessibility**: shadcn/Radix primitives carry ARIA; verify focus order in editor and modals.
- **Logging**: `electron-log` writes to `userData/logs/`; scrub Authorization / api-key headers.
- **i18n**: defer; structure copy through a single `t()` function so swapping later is mechanical.

---

## 10. Milestones & tracking checklist

Status legend: `[ ]` pending · `[~]` in progress · `[x]` done.

### M0 — Foundation
- [ ] Initialize repo: electron-vite + TS + ESLint + Prettier — [01](../tasks/01-project-bootstrap.md)
- [ ] App shell: main window, two top-level tabs (Resumes, AI Settings) — [01](../tasks/01-project-bootstrap.md)
- [ ] Tailwind + shadcn/ui set up; base theme tokens
- [ ] electron-log wired with secret scrubbing
- [ ] Vitest + Playwright skeleton; CI workflow (lint + unit) on push

### M1 — Persistence & IPC
- [ ] SQLite client + Drizzle schema + migration runner — [02](../tasks/02-database-schema.md)
- [ ] Typed IPC bridge via `contextBridge` + Zod validation — [03](../tasks/03-ipc-architecture.md)
- [ ] `projects.*` CRUD end-to-end (main → preload → renderer)
- [ ] Project list UI on Resumes tab with create / rename / delete / duplicate

### M2 — Résumé editor
- [ ] Canonical résumé Zod schema in `src/shared/resume.ts` — [04](../tasks/04-resume-data-model.md)
- [ ] Structured editor: Summary, Experience, Education, Skills, Links — [04](../tasks/04-resume-data-model.md)
- [ ] Drag-to-reorder for repeating sections (dnd-kit)
- [ ] Debounced autosave + Saving/Saved status pill

### M3 — Templates & preview
- [ ] Template loader + manifest format — [05](../tasks/05-templates-and-rendering.md)
- [ ] Render context builder (résumé JSON → render data)
- [ ] Live preview pane (sandboxed iframe via srcdoc)
- [ ] Ship 3 templates: Classic, Modern, Compact
- [ ] Template gallery with thumbnails + switch action

### M4 — Export
- [ ] PDF export via hidden BrowserWindow + `printToPDF` — [06](../tasks/06-export-pipeline.md)
- [ ] Save dialog, default filename = `{project name}.pdf`
- [ ] DOCX export from résumé JSON via `docx` library — [06](../tasks/06-export-pipeline.md)
- [ ] Export E2E test (Playwright) for both formats

### M5 — Import
- [ ] TXT / Markdown import path — [07](../tasks/07-import-pipeline.md)
- [ ] DOCX import via mammoth — [07](../tasks/07-import-pipeline.md)
- [ ] PDF import via pdfjs-dist — [07](../tasks/07-import-pipeline.md)
- [ ] Post-import review screen with raw text side-by-side

### M6 — AI providers & settings
- [ ] Provider interface + registry — [08](../tasks/08-ai-providers.md)
- [ ] Ollama adapter (streaming) — [08](../tasks/08-ai-providers.md)
- [ ] OpenAI adapter — [08](../tasks/08-ai-providers.md)
- [ ] OpenRouter adapter (OpenAI-compatible) — [08](../tasks/08-ai-providers.md)
- [ ] Google GenAI adapter — [08](../tasks/08-ai-providers.md)
- [ ] `safeStorage` secrets wrapper + provider key storage
- [ ] AI Settings tab UI: per-provider panel, masked keys, "Test connection"
- [ ] First-run hint when Ollama is unreachable

### M7 — AI enhancement UX
- [ ] Enhance button on section / bullet / whole-doc scope — [09](../tasks/09-ai-enhancement-flow.md)
- [ ] Diff/replace review UI before commit
- [ ] Cancel in-flight request (AbortController plumbed through IPC)
- [ ] Pre-enhance guardrail copy + "do not invent metrics" toggle in prompt builder

### M8 — Hardening & release prep
- [ ] electron-builder config for macOS (dmg + zip), Windows (nsis), Linux (AppImage + deb)
- [ ] Code signing + notarization (macOS), signing (Windows) — credentials flow documented
- [ ] About screen with bundled-license attributions
- [ ] Crash-only telemetry decision (opt-in or off; document choice)
- [ ] Manual QA pass against PRD §5 user journeys
- [ ] Tagged v1.0 release

### Deferred (v1.1+)
- [ ] electron-updater integration + release channel
- [ ] Additional templates
- [ ] Version history / undo beyond last-write-wins
- [ ] Section-level AI presets (tone / role targeting)
- [ ] Advanced export options (margins, font scale)

---

## 11. Risks (engineering-facing)

| Risk | Mitigation |
|------|------------|
| `better-sqlite3` native build issues across platforms | Use prebuilt binaries via `@electron/rebuild`; CI matrix builds on macOS/Win/Linux. |
| `printToPDF` font rendering differs from preview | Same renderer pipeline for both; embed/license a single default font family. |
| PDF import heuristics misclassify sections | Always show raw text + manual correction; never auto-overwrite on re-import. |
| Streaming AI cancellation leaks tokens | Pipe `AbortSignal` through the adapter; integration test that aborted requests close the socket. |
| API keys end up in logs | Centralized log scrubber + Vitest test asserting redaction patterns. |
| Template HTML accidentally executes user-controlled JS | Render in sandboxed iframe with `sandbox="allow-same-origin"` only; no `allow-scripts`. |

---

## 12. Open questions (mirrors PRD §16)

- Minimum OS versions per platform → decide before M8 signing work.
- Telemetry posture → recommend **crash-only, opt-in, off by default**; confirm with stakeholder.
- Localization scope → English-only for v1.0; structure copy for future i18n.
- Whether `resume_sections` becomes normalized in v1.1 or stays as JSON blob.

---

*End of Technical Plan.*
