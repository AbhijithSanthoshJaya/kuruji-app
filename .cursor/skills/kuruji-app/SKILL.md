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
  App.jsx           # Root: flow, state, capture SSE, question/answer fetching (see Refactoring below)
  main.jsx          # Entry: StrictMode, root render
  index.css         # Global CSS vars (fonts, --ink-*), reset
  App.css           # All component styles (incl. error-banner, app-loading)
  answer.js         # Answer API types, validateAnswerApiResponse, ANSWEREXAMPLE (fixtures)
  components/
    StartScreen.jsx     # Welcome + START → requestFullscreen then onStart
    FullscreenGate.jsx  # Click-through gate after intro, calls onEnter
    Topbar.jsx          # Brand "Kuruji Answers", sticky header
    QuestionList.jsx    # Side panel: list of questions, selectedId, setSelectedId
    QuestionView.jsx    # Selected question title, description, badges
    AnswerView.jsx      # Answer header + CodeView (Brute / Optimized) + Explanation; accepts isLoadingAnswers
    CodeView.jsx        # Title + <pre><code> for one code block
    CapturePanel.jsx   # Capture button + console (logs SSE events, max 100 lines)
```

No router: flow is controlled by `introDone` and `started` in `App.jsx`.

## App Flow and State (App.jsx)

- **introDone**: after StartScreen "START" → show FullscreenGate.
- **started**: after FullscreenGate click → show main layout (Topbar + QuestionList + canvas + CapturePanel).
- **questions**: from `GET /api/questions`, refreshed after capture complete.
- **selectedId**: current question id; used for question detail and answers.
- **answers**: from `GET /api/questions/{questionId}/answers`; sorted by `created_at` desc; **relevantAnswer** = first (latest) used for rendering.
- **error**: set by question/answer/answer-details fetch on failure; shown in error banner with Dismiss.
- **isLoading** / **isLoadingAnswers**: loading flags for questions and answers; app shows "Loading…" when questions load; AnswerView can show loading for answers.

**Capture**: `startCapture(onEvent)` POSTs to `/api/capture`, gets `job_id`, opens SSE `GET /api/capture/{jobId}/stream`, forwards all events to `onEvent`. On `complete` it closes SSE and calls `reloadQuestions()`. On `error` or stream error it rejects.

**Answer file fetching**: For the **latest** answer (relevantAnswer), if `output_files` lists filenames matching `brute_force_solution*`, `EXPLANATION*`, or `optimized_solution*`, App fetches each via `GET /api/answers/{answerId}/files/{filename}` and merges into that answer’s `bruteCode`, `explanation`, `optimizedCode`.

## API Contract

**Base URL**: `import.meta.env.VITE_API_BASE_URL` (default `http://localhost:8000`), trailing slash stripped.

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/questions` | List questions (array). |
| GET | `/api/questions/{questionId}/answers` | List answers for a question (array). |
| GET | `/api/answers/{answerId}/files/{filename}` | Raw file content (e.g. code, explanation). |
| POST | `/api/capture` | Start capture; returns `{ job_id }`. |
| GET | `/api/capture/{jobId}/stream` | SSE stream of events. |

**SSE event types**: `log`, `status`, `complete`, `error`. Payloads include `type`; `complete` has `question_title`, `answer_id`; `error` has `error`.

**Env**: `.env` with `VITE_API_BASE_URL`; see `.env.example`. Backend must allow CORS for the frontend origin (e.g. `http://localhost:5173`).

## Data Shapes

**Question** (from list): `id`, `title`, `description`, `category` (and any extra fields the API returns).

**Answer** (from list + optional file fetches): Validated with `validateAnswerApiResponse` in `answer.js`. Required: `id`, `question_id`, `title`, `description`, `language`, `output_directory`, `output_files`, `created_at`. App then adds `bruteCode`, `optimizedCode`, `explanation` from file fetches when `output_files` contains matching names (case-insensitive prefix match: `brute_force_solution`, `EXPLANATION`, `optimized_solution`).

## Conventions

- **CSS**: Global vars in `index.css` (`--font-display`, `--font-body`, `--font-mono`, `--ink-*`). Component styles in `App.css` with BEM-like class names (e.g. `question-card`, `answer-focus`, `capture-panel`, `code-block`, `error-banner`, `app-loading`).
- **API**: All fetch/SSE currently live in `App.jsx`; URLs built from `API_BASE` and helpers (`questionUrl`, `answersUrl`, `captureUrl`, `makeAnswerUrl`, `makeAnswerFilesUrl`). See **Refactoring** below for suggested API layer.
- **State**: No global store; state lives in `App.jsx` and is passed as props. Capture callback receives every SSE event for the console.
- **Validation**: All answers from the list are validated with `validateAnswerApiResponse` before `setAnswers`; invalid response throws.

## Scripts

- `npm run dev` – dev server (default `http://localhost:5173`).
- `npm run build` – production build.
- `npm run preview` – preview build.
- `npm run lint` – ESLint.

## General JS / React

General JavaScript and React questions (syntax, patterns, hooks, state, performance, etc.) are on-topic for this project. Answer them here in the Kuruji workspace; no need to redirect or treat them as out-of-scope.

## Refactoring: App.jsx does too much

Agent-1 feedback: *App.jsx does too much.* The following patterns are suggested to reduce responsibility and improve testability without changing behaviour.

1. **API layer**  
   Extract an `api` module (e.g. `src/api.js` or `src/api/questions.js`, `src/api/answers.js`, `src/api/capture.js`):
   - Centralise `API_BASE` and URL builders (`getQuestionsUrl`, `getAnswersUrl(questionId)`, `getAnswerFileUrl(answerId, filename)`, `getCaptureStreamUrl(jobId)`).
   - Expose pure fetch functions: `fetchQuestions()`, `fetchAnswers(questionId)`, `fetchAnswerFile(answerId, filename)`, `startCaptureStream(jobId, onEvent)`.
   - App (or hooks) only call these and update state; no `fetch` or URL logic in App.

2. **Custom hooks**  
   Move data-fetch and loading/error state into hooks so App mostly orchestrates and composes:
   - **useQuestions()**: returns `{ questions, loading, error, reload }`. Encapsulates initial fetch, try/catch, and loading/error state.
   - **useAnswers(questionId)**: returns `{ answers, loading, error }`. Fetches and validates list; optionally sorts by `created_at` desc and exposes `relevantAnswer`.
   - **useAnswerDetails(answer)**: given an answer from the list, fetches brute/explanation/optimized files and returns merged answer (or updates via callback). Encapsulates `collectAvailableAnswerFiles` and the file-fetch loop with try/catch.
   - **useCapture(reloadQuestions)**: returns `startCapture(onEvent)`. Encapsulates POST + SSE and calling `reloadQuestions()` on `complete`.

3. **Helpers**  
   Move pure logic out of App:
   - **collectAvailableAnswerFiles**: move to `answer.js` (with validation/types); keeps App free of file-name matching logic.
   - **Sort answers by created_at**: small helper in `answer.js` (e.g. `sortAnswersByCreatedAt(answers)`) or inside `useAnswers`; App only consumes `relevantAnswer`.

4. **Keep in App**  
   Flow and layout only: `introDone`, `started`, `selectedId`, wiring hooks together, error banner visibility, and composing Topbar / QuestionList / QuestionView / AnswerView / CapturePanel. No direct fetch or URL construction.

After refactor, App.jsx should be mostly declarations of hooks + JSX; new endpoints or file types are added in the api module and hooks, and documented here and in README.

## When Extending

- New API endpoints: add URL and fetch in the api module (or in `App.jsx` until refactor); document in this skill and README.
- New answer file types: extend `collectAvailableAnswerFiles` (in App or in `answer.js` after refactor) and the fetch/merge logic in the relevantAnswer effect or `useAnswerDetails`.
- New UI views: follow existing component pattern (functional components, props from App or from hooks), and add classes in `App.css` using existing vars and naming.
