# SG Resume Enhancer

Local-first, AI-assisted résumé editor. Desktop app built with Electron + React + TypeScript.

See [docs/PRD.md](docs/PRD.md) for product scope and [docs/Technical_Plan.md](docs/Technical_Plan.md) for the engineering roadmap.

## Quickstart

```bash
npm install
npm run dev          # launches the Electron app with HMR
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start Electron + Vite in dev mode with HMR. |
| `npm run build` | Build `main`, `preload`, and `renderer` into `out/`. |
| `npm start` | Preview the built app. |
| `npm run lint` | ESLint over `.ts` / `.tsx`. |
| `npm run format` | Prettier write-mode. |
| `npm run typecheck` | TypeScript project references, no emit. |
| `npm run test` | Vitest unit tests. |
| `npm run test:e2e` | Playwright smoke test (requires `npm run build` first). |

## Layout

```
src/
  main/        # Electron main process (Node)
  preload/     # contextBridge surface — the only renderer ↔ main path
  renderer/    # React UI (sandboxed)
  shared/      # Types & schemas shared by main and renderer
tasks/         # Per-task design notes
docs/          # PRD, Technical Plan
tests/
  unit/        # Vitest
  e2e/         # Playwright (Electron)
```

## Security defaults

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- Renderer reaches main only via the typed `window.api` exposed in [`src/preload/index.ts`](src/preload/index.ts).
- Logs are scrubbed for `Authorization`, `api-key`, and `Bearer …` patterns before write.
