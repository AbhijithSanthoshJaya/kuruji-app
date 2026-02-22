# Kuruji App (Frontend)

Kuruji is a learning-tool frontend for multi-agent analysis of what you are reading on screen. It helps you capture problem context and get structured outputs such as:

- code analysis
- system design analysis
- summaries and explanations
- comparative approaches (brute force vs optimized)

The UI lets you browse questions, inspect generated outputs, and watch capture job progress in real time.

## Stack

- React + Vite
- Plain CSS
- Fetch API + Server-Sent Events (SSE)

## Learning Workflow

1. Capture the current context from your screen/content flow.
2. Stream job progress and logs in the capture console.
3. Review generated question/answer artifacts.
4. Learn from explanations, tradeoffs, and optimized solutions.

## Features

- Start screen and question list panel for guided learning sessions
- Question detail view
- Answer view with:
  - Brute-force code
  - Optimized code
  - Explanation text
- Capture panel:
  - Starts a capture job via API
  - Streams live logs/status/complete/error events from agent workflows
  - Displays logs in a frontend console (oldest top, newest bottom, auto-scroll)

## API Endpoints Used

Configured from `VITE_API_BASE_URL`:

- `GET /api/questions`
- `GET /api/questions/{questionId}/answers`
- `GET /api/answers/{answerId}/files/{filename}`
- `POST /api/capture`
- `GET /api/capture/{jobId}/stream` (SSE)

## Environment Variables

Create `.env` in project root:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Reference template: `.env.example`.

## Local Development

Install and run:

```bash
npm install
npm run dev
```

Default app URL:

```text
http://localhost:5173
```

## Run on Local Network (Phone / Other Devices)

Run frontend:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Run FastAPI backend:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Set `.env` to laptop LAN IP:

```env
VITE_API_BASE_URL=http://<laptop-ip>:8000
```

Open on another device:

```text
http://<laptop-ip>:5173
```

## Backend CORS Requirement

FastAPI must allow frontend origin, for example:

- `http://localhost:5173`
- `http://<laptop-ip>:5173`

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run preview` - preview build
- `npm run lint` - run ESLint

## Project Structure

```text
src/
  App.jsx
  answer.js
  components/
    AnswerView.jsx
    CapturePanel.jsx
    CodeView.jsx
    QuestionList.jsx
    QuestionView.jsx
    StartScreen.jsx
    Topbar.jsx
```

## Notes

- `.env` is ignored by git.
- Keep sensitive host/IP values out of committed code.
