# 05 — Templates & rendering

**Milestone:** M3
**Owner:** TBD
**Status:** Pending

## Goal

Three HTML templates ship in MVP, render identically in preview and PDF, and consume the canonical résumé JSON.

## Template format

Each template is a directory under `templates/<id>/`:

```
templates/
└── classic/
    ├── manifest.json
    ├── template.html
    ├── styles.css
    └── thumbnail.png
```

`manifest.json`:

```json
{
  "id": "classic",
  "name": "Classic",
  "version": 1,
  "supports": ["basics", "summary", "experience", "education", "skills"]
}
```

`template.html` uses a tiny placeholder syntax (no JS execution):

- `{{ basics.fullName }}` — simple value
- `{{#each experience as item}} … {{/each}}` — repeat
- `{{#if summary}} … {{/if}}` — conditional

We implement this with a minimal interpreter (~80 LoC) — **do not pull in Handlebars** for this. Templates must remain inert HTML; the renderer parses tokens and produces final HTML, no `eval`, no script execution.

## Render pipeline

```
Resume JSON ──▶ buildRenderContext() ──▶ template engine ──▶ HTML string
                                                                  │
                          ┌───────────────────────────────────────┴────────┐
                          ▼                                                ▼
                  <iframe srcdoc=…> (preview)              hidden BrowserWindow (PDF export)
```

Same `HTML string` for both. Guarantees what-you-see-is-what-you-print.

## Preview pane

- React component renders an `<iframe srcdoc={html} sandbox="" />`.
- No `allow-scripts` — templates cannot run JS.
- A small status bar above the iframe shows zoom + paper size toggle (Letter / A4) which sets a CSS variable in the rendered HTML.

## Print CSS

Each template's `styles.css` must define:

- `@page { size: Letter; margin: 0.5in; }` (overridden for A4 mode)
- Page-break rules: `.experience-item { break-inside: avoid; }` etc.
- Print-only adjustments under `@media print`.

## Three templates

- **Classic** — serif, single column, traditional.
- **Modern** — sans-serif, two-column with left sidebar for contact + skills.
- **Compact** — dense single column for senior résumés that run long.

## Acceptance

- Switching templates on a project preserves all data.
- Preview iframe cannot execute injected `<script>` tags (verify in E2E).
- 2-page test résumé renders without orphaned headings on either template.
