import CodeView from "./CodeView";

function AnswerView({ answer, isLoadingAnswers }) {
  if (isLoadingAnswers) {
    return (
      <section className="answer-focus answer-loading">
        <div className="answer-loading-spinner" aria-hidden="true" />
        <div className="answer-language">Loading answers…</div>
      </section>
    );
  }
  if (!answer) {
    return (
      <section className="answer-focus">
        <div className="answer-header">
          <div>
            <div className="answer-language">No answer yet</div>
            <div className="answer-approach">
              Select a question with answers.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="answer-focus">
      <header className="answer-header">
        <div>
          <div className="answer-language">{answer.language}</div>
        </div>
      </header>

      <div className="code-split">
        <CodeView title="Brute Force" code={answer.bruteCode} />
        <div className="code-separator" aria-hidden="true" />
        <CodeView title="Optimized" code={answer.optimizedCode} />
      </div>

      <div className="explain">
        <div>
          <div className="explain-title">Explanation</div>
          <pre className="explanation-text">
            {answer.explanation || "Explanation not available."}
          </pre>
        </div>
      </div>
    </section>
  );
}

export default AnswerView;
