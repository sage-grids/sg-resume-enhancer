# 03 — IPC architecture

**Milestone:** M1
**Owner:** TBD
**Status:** Pending

## Goal

A small, typed, validated IPC surface between renderer and main. Renderer has zero direct access to Node, DB, or FS.

## Shape

Every channel handler is a function `(input: Zod-parsed) → Promise<Result>` where:

```ts
type Result<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };
```

The preload script exposes a typed namespaced API via `contextBridge`:

```ts
// preload/index.ts
contextBridge.exposeInMainWorld('api', {
  projects: {
    list: () => ipcRenderer.invoke('projects.list'),
    get:  (id: string) => ipcRenderer.invoke('projects.get', { id }),
    create: (input: ProjectCreateInput) => ipcRenderer.invoke('projects.create', input),
    // ...
  },
  ai: { /* ... */ },
  settings: { /* ... */ },
  system: { /* ... */ },
});
```

A matching `window.api` type lives in `src/shared/api.ts` so the renderer gets autocomplete.

## Channel groups (initial)

| Group | Channels |
|-------|----------|
| `projects` | `list`, `get`, `create`, `rename`, `duplicate`, `delete`, `exportPdf`, `exportDocx` |
| `resume` | `get`, `save` (whole-doc upsert), `import` (from path) |
| `templates` | `list`, `getById`, `renderPreviewHtml` |
| `ai` | `listProviders`, `getConfig`, `setConfig`, `testConnection`, `enhance`, `cancelEnhance` |
| `settings` | `get`, `set` |
| `system` | `pickSaveLocation`, `pickOpenFile`, `openExternal` |

## Streaming (AI)

`ai.enhance` is async-iterable. Implementation:

- Renderer calls `api.ai.enhance(req)` which returns a `requestId`.
- Main streams chunks via `webContents.send('ai.chunk', { requestId, chunk })`.
- Preload exposes `api.ai.onChunk((requestId, chunk) => …)`.
- `api.ai.cancel(requestId)` triggers the main-side `AbortController`.

## Validation & error mapping

- Every handler runs input through a Zod schema before touching DB / network.
- Domain errors map to stable `code` strings (e.g., `PROJECT_NOT_FOUND`, `OLLAMA_UNREACHABLE`, `INVALID_API_KEY`).
- Unexpected errors are logged with stack, but only `{ code: 'INTERNAL', message }` returns to the renderer.

## Security checklist

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- No `remote` module.
- Renderer cannot register IPC handlers — only invoke them.
- Templates render in a separate sandboxed iframe with `sandbox=""` (no `allow-scripts`).

## Acceptance

- A `system.ping` round-trip works from renderer → main → renderer with typed response.
- Invalid input to any handler returns `{ ok: false, error: { code: 'INVALID_INPUT', … } }` and does not throw.
- E2E: renderer cannot access `require`, `process`, or `electron` globals.
