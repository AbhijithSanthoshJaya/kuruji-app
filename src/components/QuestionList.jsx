function QuestionList({ questions, selectedId, setSelectedId }) {
  return (
    <aside className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Question List</div>
          <div className="panel-subtitle">scroll all loaded questions</div>
        </div>
        <span className="panel-pill">{questions.length}</span>
      </div>
      <div className="question-list">
        {questions.map((question) => (
          <button
            key={question.id}
            className={`question-item ${
              selectedId === question.id ? "selected" : ""
            }`}
            onClick={() => setSelectedId(question.id)}
          >
            <div>
              <div className="question-title">{question.title}</div>
              <div className="question-meta">uuid: {question.id}</div>
            </div>
            <span className="chip">{question.category}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default QuestionList;
