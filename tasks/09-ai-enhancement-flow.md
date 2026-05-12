# 09 — AI enhancement UX

**Milestone:** M7
**Owner:** TBD
**Status:** Pending

## Goal

Per PRD §7.5, let users invoke AI on a chosen scope, see streamed output, accept or reject before it touches the saved résumé.

## Scopes

- **Bullet**: rewrite a single experience bullet.
- **Section**: rewrite the entire Summary or all bullets of an Experience item.
- **Whole doc assist**: produce suggestions for every section (with a token-cost warning before firing).

Each scope has its own prompt template in `src/main/ai/prompts/`. Templates compose:

1. A shared **system prompt** ("You are an editor improving résumé writing. Preserve facts. Do not invent metrics, employers, dates, or titles.").
2. A scope-specific instruction.
3. The current content + any user-provided focus (e.g., target role).

## Pre-enhance modal

- Shows: scope, target provider/model, optional "target role" text field.
- Toggle (default ON): **"Do not invent metrics or employers"** — when ON, appends a strict guardrail clause to the prompt.
- A short reminder line: *"AI suggestions can be wrong. Review carefully before accepting."* (PRD §10 trust principle).

## Streaming diff/review UI

- Suggested output streams into a right-hand pane, side-by-side with the current text.
- Once `done`, a diff highlight overlays (use `diff-match-patch` or `jsdiff`).
- Buttons: **Accept**, **Accept with edits** (opens editor with the suggested text), **Reject**.
- Acceptance writes through the same `resume.save` path the editor uses; the autosave debounce naturally captures it.

## Cancellation

- A cancel button is available while streaming.
- Renderer calls `api.ai.cancel(requestId)`; main aborts the `AbortController` passed to the provider's `enhance()`.
- The streamed-so-far text remains visible but marked "cancelled."

## Error handling

User-facing messages per error code:

| Code | Message |
|------|---------|
| `OLLAMA_UNREACHABLE` | "Can't reach Ollama at *{base_url}*. Make sure it's running and try again." |
| `INVALID_API_KEY` | "Your *{provider}* API key looks wrong. Check it in AI Settings." |
| `MODEL_NOT_FOUND` | "Model *{model}* isn't available on *{provider}*. Pick another in AI Settings." |
| `RATE_LIMITED` | "*{provider}* is rate-limiting requests. Try again in a moment." |
| `INTERNAL` | "Something went wrong. Logs were written to *{path}*." |

## Acceptance

- Enhancing a single bullet streams tokens visibly within 1s of clicking on Ollama with a local model.
- Cancel mid-stream stops further tokens and leaves the original content unchanged.
- Accept applies the new text and the autosave indicator confirms persistence.
- The "do not invent metrics" toggle, when off, is the *only* way to disable that clause — defaulting it ON is verified by test.
