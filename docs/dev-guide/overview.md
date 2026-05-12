# Developer Overview — SG Resume Enhancer

**Last updated:** 2026-05-12
**Companion docs:** [PRD](../PRD.md), [Technical Plan](../Technical_Plan.md)

---

## What it is

A local-first Electron desktop app that helps users improve résumés with AI. All résumé data lives in SQLite on the user's machine; AI providers (Ollama default, plus OpenRouter / OpenAI / Google GenAI) are user-configurable.

---

## Architecture (two-process model)

```
┌─────────────────────────────────────────────────────────────┐
│ Main process (Node.js)                                      │
│  • Electron lifecycle, windows, menus                       │
│  • SQLite via better-sqlite3 (single source of truth)       │
│  • File I/O (import/export, dialogs)                        │
│  • AI provider adapters (outbound HTTP)                     │
│  • Secret management via safeStorage                        │
│                                                            │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ db/          │  │ ai/      │  │ import/  export/     │   │
│  │ (Drizzle ORM)│  │adapters  │  │ (pdfjs-dist, mammoth,│   │
│  │              │  │registry  │  │  docx, printToPDF)   │   │
│  └─────────────┘  └──────────┘  └──────────────────────┘   │
│                          │                                  │
│                   ┌──────┴──────┐                           │
│                   │  secrets/   │                           │
│                   │ safeStorage │                           │
│                   └──────▲──────┘                           │
│                          │ IPC (typed, Zod-validated)       │
│              ┌───────────┴────────────┐                     │
│              │     preload/           │                     │
│              │  contextBridge → api   │                     │
│              └───────────▲────────────┘                     │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│ Renderer process (Chromium sandbox)                         │
│  • React 18 + TypeScript + Tailwind + shadcn/ui            │
│  • MemoryRouter (two tabs → nested project workspace)      │
│  • React Query for IPC results, Zustand for local state    │
│  • window.api is the ONLY bridge to main                   │
│  • Templates render in sandboxed iframes                    │
└─────────────────────────────────────────────────────────────┘
```

### Key invariants

- **contextIsolation: true, sandbox: true, nodeIntegration: false** — the renderer never touches Node.
- All IPC handlers validate inputs with Zod and return `{ ok: true, data } | { ok: false, error: { code, message } }`.
- API keys never cross IPC in plaintext; the renderer references them by provider id.
- Logs are scrubbed of `Authorization`, `api-key`, `Bearer …` before writing.

---

## Stack summary

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Shell | Electron (latest LTS) | Cross-platform desktop |
| Bundler | electron-vite | Fast HMR, TypeScript-first |
| UI | React 18 + TypeScript | Mature ecosystem |
| Styling | Tailwind + shadcn/ui (Radix) | Accessible, no bespoke design system |
| State | Zustand + React Query | Small surface area, IPC-as-async-source |
| DB | better-sqlite3 + Drizzle ORM | Synchronous, type-safe, no codegen daemon |
| Validation | Zod | IPC boundary, provider config, import data |
| Secrets | Electron safeStorage | OS-native encryption |
| PDF export | webContents.printToPDF | Bundled Chromium, zero deps |
| DOCX export | docx (npm) | Generated from structured JSON |
| PDF import | pdfjs-dist | Pure JS text extraction |
| DOCX import | mammoth | DOCX → HTML/text |
| Logging | electron-log | File + console, ring-buffered, scrubbed |

---

## Folder layout

```
.
├── docs/                   # PRD, Technical Plan, dev-guide
├── tasks/                  # Per-feature design docs (M0–M8)
├── templates/              # Bundled HTML résumé templates
├── src/
│   ├── main/               # Electron main process
│   │   ├── ipc/            # One file per channel group
│   │   ├── db/             # Drizzle schema, migrations, repos
│   │   ├── ai/             # Provider adapters + registry
│   │   ├── import/         # pdf, docx, text/markdown
│   │   ├── export/         # pdf, docx
│   │   ├── templates/      # Template loader + renderer
│   │   ├── secrets/        # safeStorage wrapper
│   │   └── logger.ts       # electron-log + scrubber
│   ├── preload/            # contextBridge (the only bridge)
│   ├── shared/             # Types & Zod schemas (both processes)
│   └── renderer/           # React UI
│       ├── src/
│       │   ├── app/        # Router, layout, tabs
│       │   ├── features/   # resumes/, settings/, templates/, ...
│       │   ├── components/ # shadcn/ui primitives
│       │   └── lib/        # cn(), api client wrappers
│       └── ...
├── tests/
│   ├── unit/               # Vitest
│   └── e2e/                # Playwright (_electron)
├── CLAUDE.md               # Agent notes for AI coding sessions
├── electron.vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Milestone roadmap (M0–M8)

| Milepost | What ships |
|----------|------------|
| **M0** | App shell, two tabs, Tailwind/shadcn, log scrubber, Vitest + Playwright skeletons, CI |
| **M1** | SQLite + Drizzle + migrations; typed IPC envelope; projects CRUD wired end-to-end |
| **M2** | Résumé data model & structured editor (sections, entries, inline editing) |
| **M3** | Template system (HTML-based, live preview, sandboxed iframe rendering) |
| **M4** | PDF & DOCX export pipeline |
| **M5** | Import pipeline (PDF, DOCX, TXT/MD → structured résumé) |
| **M6** | AI provider framework (adapters, registry, config UI, secret storage) |
| **M7** | AI enhancement flow (select scope, call, diff/apply) |
| **M8** | Polish, edge cases, error handling, E2E coverage, packaging |

See the [Technical Plan](../Technical_Plan.md) for the full checklist.

---

## Key design decisions

- **HTML templates are the single render path** for both live preview and PDF export (WYSIWYP).
- **DOCX is generated from structured JSON**, never from HTML, to guarantee fidelity.
- **`printToPDF`** replaces Puppeteer; no second Chromium download.
- **Drizzle over Prisma** avoids a query engine binary per platform.
- **`safeStorage`** keeps API keys encrypted at rest; plaintext only decrypted in-memory during outbound AI calls.

---

## IPC protocol

Every IPC channel follows the same shape:

```ts
// request (renderer → main via window.api)
ipcRenderer.invoke("channel:action", payload)

// response (main → renderer)
{ ok: true, data: T }
{ ok: false, error: { code: string, message: string } }
```

All payloads are validated with Zod inside the handler. See `tasks/03-ipc-architecture.md` for the full spec.
