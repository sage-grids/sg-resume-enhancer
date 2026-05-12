# Quickstart — SG Resume Enhancer

**Last updated:** 2026-05-12

---

## Prerequisites

- **Node.js** >= 18 (LTS recommended)
- **npm** >= 9
- **Git**

---

## Setup

```bash
git clone <repo-url>
cd sg-resume-enhancer

npm install
```

> `better-sqlite3` is a native module that must be compiled for the correct ABI. Run the appropriate rebuild command before your first `dev` or `test` session.

---

## Development

Start the Electron app with Vite HMR:

```bash
npm run dev
```

This launches the Electron window. The renderer hot-reloads on file changes; the main process restarts automatically.

### Switching between Electron and Node ABI

`better-sqlite3` needs different binaries for Electron (dev / e2e) vs Node (vitest).

| Use case | Command |
|----------|---------|
| Before `npm run dev` or `npm run test:e2e` | `npm run rebuild:electron` |
| Before `npm run test` (vitest) | `npm run rebuild:node` |

---

## Build & preview

```bash
npm run build        # compile main, preload, renderer → out/
npm start            # launch the built app
```

---

## Lint & type-check

```bash
npm run lint
npm run typecheck
```

---

## Test

```bash
# Unit tests (Vitest) — requires rebuild:node first
npm run test

# E2E tests (Playwright _electron) — requires npm run build first
npm run test:e2e
```

---

## Common commands reference

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server + Electron with HMR |
| `npm run build` | Build all three targets (main, preload, renderer) |
| `npm start` | Launch the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run rebuild:electron` | Compile better-sqlite3 for Electron ABI |
| `npm run rebuild:node` | Compile better-sqlite3 for Node ABI |

---

## Project structure overview

```
src/
  main/        Electron main process (Node)
  preload/     contextBridge (only bridge between main & renderer)
  shared/      Types & Zod schemas used by both processes
  renderer/    React UI (sandboxed Chromium)
```

See the [Developer Overview](./overview.md) for the full architectural guide.
