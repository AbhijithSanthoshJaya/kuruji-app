import { useState, useEffect } from "react";
import "./App.css";
import AnswerView from "./components/AnswerView";
import QuestionList from "./components/QuestionList";
import QuestionView from "./components/QuestionView";
import StartScreen from "./components/StartScreen";
import Topbar from "./components/Topbar";
import { validateAnswerApiResponse } from "./answer";

const questionUrl = "http://localhost:8000/api/questions";
const answersUrl = "http://localhost:8000/api/answers";
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

  useEffect(() => {
    const fetchQuestion = async () => {
      let response = await fetch(questionUrl);
      let data = await response.json();
      setQuestions(data);
    };
    fetchQuestion();
  }, []);
  console.log("Here are some questions", questions);
  const selectedQuestion = questions.find(
    (question) => question.id === selectedId
  );
  useEffect(() => {
    const fetchAnswers = async () => {
      console.log("Selected question", selectedQuestion);

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
        releventAnswer.output_files
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
            `File fetch failed: ${fileName} (${fileResponse.status})`
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
          })
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
            onSelect={setSelectedId}
          />
          {selectedQuestion ? (
            <main className="canvas">
              <QuestionView question={selectedQuestion} />
              <AnswerView answer={answers[0]} />
            </main>
          ) : null}
        </div>
      ) : (
        <StartScreen
          onStart={() => {
            setStarted(true);
            setSelectedId(QUESTIONS[0]?.id ?? null);
          }}
        />
      )}
    </div>
  );
}

export default App;
