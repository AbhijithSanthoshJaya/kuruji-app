--- 
name: kuruji-app
description: Documents the Kuruji learning-tool frontend: React + Vite app for multi-agent capture, questions, and answers (brute vs optimized code, explanations). Use when working in this repo, adding features, fixing bugs, or integrating with the capture/answers API. General JavaScript and React questions should be answered in this project context.
---

# Kuruji App – Codebase Skill

This skill summarizes the existing Kuruji frontend so the agent can work consistently with the codebase.

## What Kuruji Is

Kuruji is a **learning-tool frontend** for multi-agent analysis of on-screen content. Users:

1. Capture context (trigger backend capture job).
2. Watch capture job progress via SSE in the capture console.
3. Browse questions and view generated answers (brute-force code, optimized code, explanation).

**Stack**: React 19 + Vite 7, plain CSS (no UI library), Fetch API + Server-Sent Events (SSE).

## Project Structure

```
src/
  App.jsx           # Root: routing-like flow, API URLs, state, capture SSE, answer fetching
  main.jsx          # Entry: StrictMode, root render
  index.css         # Global CSS vars (fonts, --ink-*), reset
  App.css           # All component styles
  answer.js         # Answer API types, validateAnswerApiResponse, ANSWEREXAMPLE (fixtures)
  components/
    StartScreen.jsx     # Welcome + START → requestFullscreen then onStart
    FullscreenGate.jsx  # Click-through gate after intro, calls onEnter
    Topbar.jsx          # Brand "Kuruji Answers", sticky header
    QuestionList.jsx    # Side panel: list of questions, selectedId, setSelectedId
    QuestionView.jsx    # Selected question title, description, badges
    AnswerView.jsx      # Answer header + CodeView (Brute / Optimized) + Explanation
    CodeView.jsx        # Title + <pre><code> for one code block
    CapturePanel.jsx    # Capture button + console (logs SSE events, max 100 lines)
```

No router: flow is controlled by `introDone` and `started` in `App.jsx`.

## App Flow and State (App.jsx)

- **introDone**: after StartScreen "START" → show FullscreenGate.
- **started**: after FullscreenGate click → show main layout (Topbar + QuestionList + canvas + CapturePanel).
- **questions**: from `GET /api/questions`, refreshed after capture complete.
- **selectedId**: current question id; used for question detail and answers.
- **answers**: from `GET /api/questions/{questionId}/answers`; only first answer is shown (`answers[0]`).

**Capture**: `startCapture(onEvent)` POSTs to `/api/capture`, gets `jobId`, opens SSE `GET /api/capture/{jobId}/stream`, forwards all events to `onEvent`. On `complete` it closes SSE and calls `reloadQuestions()`. On `error` or stream error it rejects.

**Answer file fetching**: For the selected question’s first answer, if `output_files` lists filenames matching `brute_force_solution*`, `EXPLANATION*`, or `optimized_solution*`, App fetches each via `GET /api/answers/{answerId}/files/{filename}` and merges into that answer’s `bruteCode`, `explanation`, `optimizedCode`. Other answer fields come from the list response.

## API Contract

**Base URL**: `import.meta.env.VITE_API_BASE_URL` (default `http://localhost:8000`), trailing slash stripped.

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/questions` | List questions (array). |
| GET | `/api/questions/{questionId}/answers` | List answers for a question (array). |
| GET | `/api/answers/{answerId}/files/{filename}` | Raw file content (e.g. code, explanation). |
| POST | `/api/capture` | Start capture; returns `{ jobId }` or `{ job_id }`. |
| GET | `/api/capture/{jobId}/stream` | SSE stream of events. |

**SSE event types**: `log`, `status`, `complete`, `error`. Payloads include `type`; `complete` has `question_title`, `answer_id`; `error` has `error`.

**Env**: `.env` with `VITE_API_BASE_URL`; see `.env.example`. Backend must allow CORS for the frontend origin (e.g. `http://localhost:5173`).

## Data Shapes

**Question** (from list): `id`, `title`, `description`, `category` (and any extra fields the API returns).

**Answer** (from list + optional file fetches): Validated with `validateAnswerApiResponse` in `answer.js`. Required: `id`, `question_id`, `title`, `description`, `language`, `output_directory`, `output_files`, `created_at`. App then adds `bruteCode`, `optimizedCode`, `explanation` from file fetches when `output_files` contains matching names (case-insensitive prefix match: `brute_force_solution`, `EXPLANATION`, `optimized_solution`).

## Conventions

- **CSS**: Global vars in `index.css` (`--font-display`, `--font-body`, `--font-mono`, `--ink-*`). Component styles in `App.css` with BEM-like class names (e.g. `question-card`, `answer-focus`, `capture-panel`, `code-block`).
- **API**: All fetch/SSE in `App.jsx`; no separate API module. URLs built from `API_BASE` and helpers (`questionUrl`, `answersUrl`, `captureUrl`, `makeAnswerUrl`, `makeAnswerFilesUrl`).
- **State**: No global store; state lives in `App.jsx` and is passed as props. Capture callback receives every SSE event for the console.
- **Validation**: All answers from the list are validated with `validateAnswerApiResponse` before `setAnswers`; invalid response throws.

## Scripts

- `npm run dev` – dev server (default `http://localhost:5173`).
- `npm run build` – production build.
- `npm run preview` – preview build.
- `npm run lint` – ESLint.

## General JS / React

General JavaScript and React questions (syntax, patterns, hooks, state, performance, etc.) are on-topic for this project. Answer them here in the Kuruji workspace; no need to redirect or treat them as out-of-scope.

## When Extending

- New API endpoints: add URL construction in `App.jsx` and document in this skill and README.
- New answer file types: extend `collectAvailableAnswerFiles` and the fetch/merge logic in the `relevantAnswer` effect.
- New UI views: follow existing component pattern (functional components, props from App), and add classes in `App.css` using existing vars and naming.
