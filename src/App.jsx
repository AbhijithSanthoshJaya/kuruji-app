import { useState, useEffect } from "react";
import "./App.css";
import AnswerView from "./components/AnswerView";
import CapturePanel from "./components/CapturePanel";
import FullscreenGate from "./components/FullscreenGate";
import QuestionList from "./components/QuestionList";
import QuestionView from "./components/QuestionView";
import StartScreen from "./components/StartScreen";
import Topbar from "./components/Topbar";
import { validateAnswerApiResponse } from "./answer";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");
const questionUrl = `${API_BASE}/api/questions`;
const answersUrl = `${API_BASE}/api/answers`;
const captureUrl = `${API_BASE}/api/capture`;
const makeAnswerUrl = (id) => `${questionUrl}/${id}/answers`;
const makeAnswerFilesUrl = (id, filename) =>
  `${answersUrl}/${id}/files/${filename}`;
const collectAvailableAnswerFiles = (outputFiles) => {
  const expectedFiles = [
    "brute_force_solution",
    "EXPLANATION",
    "optimized_solution",
  ];
  const files = Array.isArray(outputFiles) ? outputFiles : [];
  console.log("Output files:", files);
  const availableFiles = new Set();
  for (const expected of expectedFiles) {
    const matcher = new RegExp(`^${expected}(\\..+)?$`, "i");
    const matches = files.filter((file) => matcher.test(String(file)));
    if (matches.length === 0) {
      console.log(`Missing file: ${expected}`);
    } else {
      console.log("Files found");
      matches.forEach((file) => availableFiles.add(String(file)));
    }
  }
  return availableFiles;
};

function App() {
  const [introDone, setIntroDone] = useState(false);
  const [started, setStarted] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const reloadQuestions = async () => {
    const response = await fetch(questionUrl);
    if (!response.ok) {
      throw new Error(`Question request failed: ${response.status}`);
    }
    const data = await response.json();
    const nextQuestions = Array.isArray(data) ? data : [];
    setQuestions(nextQuestions);
    setSelectedId((prevId) => {
      if (!prevId) {
        return nextQuestions[0]?.id ?? null;
      }
      const exists = nextQuestions.some((question) => question.id === prevId);
      return exists ? prevId : (nextQuestions[0]?.id ?? null);
    });
  };

  useEffect(() => {
    const fetchQuestion = async () => {
      setError(null);
      setIsLoading(true);
      try {
        await reloadQuestions();
      } catch (err) {
        setError(err);
        setIsLoading(false);
        console.error("Error fetching questions:", err);
      }
      setIsLoading(false);
    };
    fetchQuestion();
  }, []);
  useEffect(() => {
    if (started && !selectedId && questions.length > 0) {
      setSelectedId(questions[0].id ?? null);
    }
  }, [started, selectedId, questions]);

  const selectedQuestion = questions.find(
    (question) => question.id === selectedId,
  );
  // App.jsx
  const startCapture = async (onEvent) => {
    const response = await fetch(captureUrl, { method: "POST" });
    if (!response.ok)
      throw new Error(`Capture request failed: ${response.status}`);

    const data = await response.json();
    const jobId = data?.job_id;
    if (!jobId) throw new Error("Capture response missing jobId.");

    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(`${captureUrl}/${jobId}/stream`);

      eventSource.onmessage = (event) => {
        const eventData = JSON.parse(event.data);

        // push every event to UI
        onEvent?.(eventData);

        if (eventData.type === "complete") {
          eventSource.close();
          reloadQuestions()
            .then(() => resolve(eventData))
            .catch(reject);
        } else if (eventData.type === "error") {
          eventSource.close();
          reject(new Error(eventData.error || "Capture failed"));
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error("Capture stream connection failed."));
      };
    });
  };

  useEffect(() => {
    const fetchAnswers = async () => {
      if (!selectedQuestion?.id) {
        setAnswer(null);
        setIsLoadingAnswers(false);
        return;
      }
      setError(null);
      setIsLoadingAnswers(true);
      try {
        const url = makeAnswerUrl(selectedQuestion.id);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Answer request failed: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Answer response is not an array.");
        }
        for (const a of data) {
          const validation = validateAnswerApiResponse(a);
          if (!validation.valid) {
            throw new Error(`Answer validation failed: ${validation.error}`);
          }
        }
        const sorted = [...data].sort((a, b) => {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tB - tA;
        });
        setAnswer(sorted[0] ?? null);
      } catch (err) {
        setAnswer(null);
        setError(err);
        console.error("Error fetching answers:", err);
      } finally {
        setIsLoadingAnswers(false);
      }
    };
    fetchAnswers();
  }, [selectedId]);

  useEffect(() => {
    const fetchAnswerDetails = async () => {
      if (!answer) {
        return;
      }
      if (answer.explanation && answer.bruteCode && answer.optimizedCode) {
        return;
      }
      setError(null);
      try {
        const availableFiles = collectAvailableAnswerFiles(answer.output_files);
        for (const fileName of availableFiles) {
          const isExplanation = /^EXPLANATION(\..+)?$/i.test(fileName);
          const isBrute = /^brute_force_solution(\..+)?$/i.test(fileName);
          const isOptimized = /^optimized_solution(\..+)?$/i.test(fileName);
          if (
            (!isExplanation && !isBrute && !isOptimized) ||
            (isExplanation && answer.explanation) ||
            (isBrute && answer.bruteCode) ||
            (isOptimized && answer.optimizedCode)
          ) {
            continue;
          }
          const fileUrl = makeAnswerFilesUrl(answer.id, fileName);
          const fileResponse = await fetch(fileUrl);
          if (!fileResponse.ok) {
            throw new Error(
              `Answer file failed: ${fileName} (${fileResponse.status})`,
            );
          }
          const fileText = await fileResponse.text();
          setAnswer((prev) => {
            if (!prev || prev.id !== answer.id) return prev;
            if (isExplanation) return { ...prev, explanation: fileText };
            if (isBrute) return { ...prev, bruteCode: fileText };
            if (isOptimized) return { ...prev, optimizedCode: fileText };
            return prev;
          });
        }
      } catch (err) {
        setError(err);
        console.error("Error fetching answer details:", err);
      }
    };
    fetchAnswerDetails();
  }, [
    answer?.id,
    answer?.output_files,
    answer?.explanation,
    answer?.bruteCode,
    answer?.optimizedCode,
  ]);

  return (
    <div className="app">
      {started ? <Topbar /> : null}
      {isLoading ? (
        <div className="app-loading" role="status" aria-live="polite">
          Loading…
        </div>
      ) : started ? (
        <>
          {error ? (
            <div className="error-banner" role="alert">
              <span className="error-banner__message">
                {error instanceof Error ? error.message : String(error)}
              </span>
              <button
                type="button"
                className="error-banner__dismiss"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          ) : null}
          <div className="layout simple">
            <QuestionList
              questions={questions}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
            />
            <main className="canvas">
              {selectedQuestion ? (
                <>
                  <QuestionView question={selectedQuestion} />
                  <AnswerView
                    answer={answer}
                    isLoadingAnswers={isLoadingAnswers}
                  />
                </>
              ) : null}
              <CapturePanel onCapture={startCapture} />
            </main>
          </div>
        </>
      ) : introDone ? (
        <FullscreenGate
          onEnter={() => {
            setStarted(true);
          }}
        />
      ) : (
        <StartScreen
          onStart={() => {
            setIntroDone(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
