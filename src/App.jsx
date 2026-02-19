import { useState, useEffect } from "react";
import "./App.css";
import AnswerView from "./components/AnswerView";
import CapturePanel from "./components/CapturePanel";
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
  const [started, setStarted] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
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
      await reloadQuestions();
    };
    fetchQuestion();
  }, []);
  useEffect(() => {
    if (started && !selectedId && questions.length > 0) {
      setSelectedId(questions[0].id);
    }
  }, [started, selectedId, questions]);

  console.log("Here are some questions", questions);
  const selectedQuestion = questions.find(
    (question) => question.id === selectedId,
  );
  // App.jsx
  const startCapture = async (onEvent) => {
    const response = await fetch(captureUrl, { method: "POST" });
    if (!response.ok)
      throw new Error(`Capture request failed: ${response.status}`);

    const data = await response.json();
    const jobId = data?.jobId ?? data?.job_id;
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
      console.log("Selected question", selectedQuestion);
      if (!selectedQuestion?.id) {
        setAnswers([]);
        return;
      }

      const answersUrl = makeAnswerUrl(selectedQuestion.id);
      let response = await fetch(answersUrl);
      if (!response.ok) {
        throw new Error(`Answer request failed: ${response.status}`);
      }
      let answers = await response.json();
      if (!Array.isArray(answers)) {
        throw new Error("Answer response is not an array.");
      }
      for (const answer of answers) {
        const validation = validateAnswerApiResponse(answer);
        if (!validation.valid) {
          throw new Error(`Answer validation failed: ${validation.error}`);
        }
      }
      setAnswers(answers);
    };
    fetchAnswers();
  }, [selectedId]);
  console.log("Here are answers", answers);
  let releventAnswer = answers[0];
  useEffect(() => {
    const fetchAnswerDetails = async () => {
      if (!releventAnswer) {
        console.log("No relevant answer found yet.");
        return;
      }
      if (
        releventAnswer.explanation &&
        releventAnswer.bruteCode &&
        releventAnswer.optimizedCode
      ) {
        return;
      }
      console.log("Relevant answer: ", releventAnswer);
      const availableFiles = collectAvailableAnswerFiles(
        releventAnswer.output_files,
      );
      for (const fileName of availableFiles) {
        const isExplanation = /^EXPLANATION(\..+)?$/i.test(fileName);
        const isBrute = /^brute_force_solution(\..+)?$/i.test(fileName);
        const isOptimized = /^optimized_solution(\..+)?$/i.test(fileName);
        if (
          (!isExplanation && !isBrute && !isOptimized) ||
          (isExplanation && releventAnswer.explanation) ||
          (isBrute && releventAnswer.bruteCode) ||
          (isOptimized && releventAnswer.optimizedCode)
        ) {
          continue;
        }
        const fileUrl = makeAnswerFilesUrl(releventAnswer.id, fileName);
        console.log("Answer file url", fileUrl);
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
          console.log(
            `File fetch failed: ${fileName} (${fileResponse.status})`,
          );
          continue;
        }
        const fileText = await fileResponse.text();
        setAnswers((prevAnswers) =>
          prevAnswers.map((answer) => {
            if (answer.id !== releventAnswer.id) {
              return answer;
            }
            if (isExplanation) {
              return { ...answer, explanation: fileText };
            }
            if (isBrute) {
              return { ...answer, bruteCode: fileText };
            }
            if (isOptimized) {
              return { ...answer, optimizedCode: fileText };
            }
            return answer;
          }),
        );
        console.log(`Fetched file: ${fileName}`);
      }
    };
    fetchAnswerDetails();
  }, [
    releventAnswer?.id,
    releventAnswer?.output_files,
    releventAnswer?.explanation,
    releventAnswer?.bruteCode,
    releventAnswer?.optimizedCode,
  ]);

  return (
    <div className="app">
      <Topbar />
      {started ? (
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
                <AnswerView answer={answers[0]} />
              </>
            ) : null}
            <CapturePanel onCapture={startCapture} />
          </main>
        </div>
      ) : (
        <StartScreen
          onStart={() => {
            setStarted(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
