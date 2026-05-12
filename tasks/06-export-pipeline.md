# 06 — Export pipeline (PDF + DOCX)

**Milestone:** M4
**Owner:** TBD
**Status:** Pending

## Goal

Reliable PDF and DOCX export from the canonical résumé JSON.

## PDF — `webContents.printToPDF`

Flow (in main):

1. Build the HTML using the shared template renderer (same one preview uses).
2. Create a hidden `BrowserWindow` with `{ show: false, webPreferences: { offscreen: true, sandbox: true } }`.
3. `loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))` *or* write the HTML to a temp file and load via `file://` for reliable relative asset paths.
4. Wait for `did-finish-load` **and** `document.fonts.ready` (eval in renderer) before printing.
5. Call `webContents.printToPDF({ printBackground: true, pageSize: paperSize, margins: { marginType: 'custom', top: 0.5, … } })`.
6. Write resulting Buffer to user-chosen path via save dialog.
7. Destroy hidden window.

### Gotchas

- Custom fonts: either bundle as `@font-face` from local file or limit to system fonts on each platform. Picking one bundled font family removes a class of bugs.
- Image assets in templates: reference relative paths that resolve from the temp file location.
- `printToPDF` doesn't always respect `@page size` reliably — pass `pageSize` explicitly.

## DOCX — `docx` library

Generate from the résumé JSON, not from HTML. Mapping:

| JSON field | DOCX construct |
|-----------|----------------|
| `basics.fullName` | Heading 1 |
| `basics.headline` | Subheading / Heading 3 |
| `basics.{email,phone,location,links}` | Single-line paragraph, separated by `•` |
| `summary` | Body paragraph(s) |
| `experience[]` | Section heading + per-item: role @ company, dates right-aligned, bullets |
| `education[]` | Section heading + per-item one-liner with bold institution |
| `skills[]` | Section heading + per-group: `Category: item, item, item` |

Section / heading styles are defined once in a shared style sheet so the output is consistent.

### Why not HTML → DOCX

Tested options (html-docx-js, html-to-docx) drop styles, mis-handle tables, and produce documents that look broken in Word. The PRD §12 explicitly prefers structured generation; comply.

## UX

- "Export" button in the project workspace opens a small dialog: format toggle (PDF/DOCX), paper size (PDF only), filename, location.
- Show a progress indicator for PDF (the BrowserWindow load can take ~1s).
- Toast on success with "Reveal in Finder/Explorer" action.

## Acceptance

- A representative 2-page résumé exports cleanly to PDF on macOS, Windows, Linux with consistent layout.
- DOCX opens in Word, LibreOffice, and Google Docs without "document corrupted" warnings.
- Playwright test: trigger export, verify file exists and is non-empty.
- Unit test: DOCX builder produces a valid `.docx` (unzippable, contains `word/document.xml`).
