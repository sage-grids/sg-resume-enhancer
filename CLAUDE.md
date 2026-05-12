# CLAUDE.md

Project notes for future Claude Code sessions. Concise, load-bearing only.

## What this project is

**SG Resume Enhancer** — a local-first Electron desktop app that helps users improve résumés with AI. All résumé data lives in SQLite on the user's machine; AI providers (Ollama default, plus OpenRouter / OpenAI / Google GenAI) are user-configurable.

Authoritative specs:
- Product scope: [`docs/PRD.md`](docs/PRD.md)
- Engineering roadmap + checklist: [`docs/Technical_Plan.md`](docs/Technical_Plan.md)
- Per-task design docs: [`tasks/`](tasks/)

When the user asks for "what's left" or "next task," read the M0–M8 checklist in `Technical_Plan.md` §10 first.

## Stack (chosen, do not re-litigate without reason)

- **Shell**: Electron + `electron-vite`
- **UI**: React 18 + TypeScript, Tailwind + shadcn/ui primitives, `react-router-dom` (MemoryRouter)
- **State**: Zustand (planned) + React Query for IPC results
- **DB**: `better-sqlite3` + Drizzle ORM, raw SQL migrations in `src/main/db/migrations/`
- **Validation**: Zod (boundary checks on every IPC handler)
- **Export**: PDF via Electron's `webContents.printToPDF` (no Puppeteer); DOCX via `docx` library generated from the canonical résumé JSON, **not** from HTML
- **Import**: `pdfjs-dist` (PDF), `mammoth` (DOCX), native (TXT/MD)
- **Secrets**: Electron `safeStorage` → encrypted base64 in `settings` table
- **Tests**: Vitest (unit) + Playwright `_electron` (E2E smoke)

## Security defaults (do not weaken)

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`
- Renderer talks to main ONLY through `window.api` exposed in `src/preload/index.ts`
- Templates render in sandboxed iframes with `sandbox=""` — never `allow-scripts`
- API keys never cross IPC in plaintext; renderer references them by provider id
- Log scrubber in `src/main/logger.ts` redacts `Authorization`, `api-key`, `Bearer …` — keep secrets out of logs

## Folder map

```
src/main/        Electron main process (Node only)
  ipc/           One file per channel group
  db/            (planned) Drizzle schema, migrations, repos
  ai/            (planned) Provider adapters + registry
  import/        (planned) pdf, docx, text/markdown
  export/        (planned) pdf, docx
  templates/     (planned) Template loader + renderer
  secrets/       (planned) safeStorage wrapper
  logger.ts      electron-log + secret scrubber
src/preload/     contextBridge typed API surface (the only main↔renderer bridge)
src/shared/      Types & Zod schemas used by both processes
src/renderer/    React UI
  src/app/       Router, layout, tabs
  src/features/  resumes/, settings/, (planned) templates/, export/, ai/
  src/components/ui/   shadcn primitives (Button, Card so far)
  src/lib/       cn() utility, api client wrappers
templates/       (planned) Bundled HTML résumé templates
tests/unit/      Vitest
tests/e2e/       Playwright
```

## Conventions

- **IPC**: every handler validates input with Zod and returns `{ ok: true, data } | { ok: false, error: { code, message } }`. See `tasks/03-ipc-architecture.md`.
- **Résumé schema**: single canonical Zod schema in `src/shared/resume.ts` (planned in M2). Bump `schemaVersion` for breaking changes; write a migration.
- **Templates**: same renderer pipeline drives both live preview and PDF export — what you see is what you print.
- **DOCX**: generate from structured JSON; do NOT attempt HTML→DOCX conversion (fidelity is bad).

## Commands

```bash
npm run dev          # Electron + Vite, HMR
npm run build        # build main/preload/renderer → out/
npm start            # preview built app
npm run lint
npm run typecheck
npm run test         # Vitest
npm run test:e2e     # Playwright (requires `npm run build` first)
npm run rebuild:electron  # better-sqlite3 → Electron ABI (before dev / e2e)
npm run rebuild:node      # better-sqlite3 → Node ABI (before vitest)
```

`better-sqlite3` is a native module with a single compiled binary per install. Switching between `vitest` (Node ABI) and `dev` / `test:e2e` (Electron ABI) requires running the appropriate rebuild script.

## Status

- ✅ **M0 — Foundation**: app shell, two tabs, Tailwind/shadcn, log scrubber, Vitest + Playwright skeletons, CI on push.
- ✅ **M1 — Persistence & IPC**: SQLite + Drizzle schema + raw-SQL migration runner (WAL on, idempotent); typed IPC envelope with Zod validation; `projects.*` CRUD wired end-to-end; Resumes tab project list with create / rename / duplicate / delete.
- ⏭️ Next up: **M2 — Résumé editor** (see `tasks/04-resume-data-model.md`).
