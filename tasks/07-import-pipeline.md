# 07 — Import pipeline

**Milestone:** M5
**Owner:** TBD
**Status:** Pending

## Goal

Let users start a project from an existing résumé file. Honest about limits per PRD §7.2.

## Formats

| Format | Parser | Strategy |
|--------|--------|----------|
| `.txt`, `.md` | native + simple regex | Heuristic section split on headings. |
| `.docx` | `mammoth.convertToHtml` | Walk resulting DOM; map `h1/h2` to sections, `ul > li` to bullets. |
| `.pdf` | `pdfjs-dist` | Extract per-page text items with positions; cluster by y-coordinate; section-split on uppercase / known headings. |

## Section heuristics

Look for headings (case-insensitive, fuzzy match): `summary | profile`, `experience | employment | work`, `education`, `skills | competencies`, `projects`, `certifications`.

Anything before the first known heading is treated as "basics" (name on first non-empty line, contact line on the next).

## Output

The importer never writes directly into a project. It returns a `ImportCandidate`:

```ts
type ImportCandidate = {
  rawText: string;          // shown side-by-side for verification
  parsed: Partial<Resume>;  // best-effort structured guess
  warnings: string[];       // e.g., "Could not detect Skills section"
};
```

The renderer shows a **two-pane review screen**:

- Left: parsed structured form (editable).
- Right: raw extracted text (read-only).
- Bottom: "Create project from this" button. Nothing is persisted until the user commits.

## Constraints

- Run parsing in main (CPU-heavy, blocks renderer otherwise).
- Cap input file size at 10 MB; show a clear error above that.
- Never re-run import on an existing project's data — import only creates new projects (avoids destroying user edits).

## Acceptance

- All three formats produce *something useful* on a curated set of 5 sample résumés.
- Review screen lets a user correct mis-parsed fields and ship them to a new project.
- Warnings surface when section detection fails (so the user knows to fill in manually rather than getting silent emptiness).
