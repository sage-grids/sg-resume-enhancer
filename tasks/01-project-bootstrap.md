# 01 — Project bootstrap

**Milestone:** M0
**Owner:** TBD
**Status:** Pending

## Goal

Stand up a runnable Electron + React + TypeScript skeleton with the two top-level tabs from PRD §6.1, plus the tooling baseline the rest of the plan assumes.

## Deliverables

- `package.json` with `electron-vite`, React, TypeScript, ESLint, Prettier, Tailwind, Vitest, Playwright.
- `electron.vite.config.ts` configured for `main`, `preload`, `renderer` entries.
- App boots into a window with two tabs (**Resumes**, **AI Settings**), each rendering an empty-state placeholder.
- Tailwind + shadcn/ui initialized; one shared `Button` and `Card` proven in the UI.
- `electron-log` wired in main; renderer can write logs via IPC; log scrubber redacts `Authorization`, `api-key`, `Bearer …` patterns.
- GitHub Actions: lint + typecheck + unit test on push/PR.
- README quickstart: `npm install`, `npm run dev`, `npm run build`.

## Key decisions

- **electron-vite** over Forge / Webpack for HMR speed and simpler config.
- **Memory router** in renderer (not BrowserRouter) — we're not on a real URL bar.
- **`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`** baked in from the start; preload script exposes only `window.api`.

## Out of scope

- DB, IPC handlers beyond a `system.ping` smoke test, any feature work.

## Acceptance

- `npm run dev` opens a window showing the two tabs.
- `npm run lint && npm run typecheck && npm run test` passes in CI.
- Smoke E2E: Playwright launches the packaged-in-dev app and asserts both tab labels are visible.
