function QuestionView({ question }) {
  return (
    <section className="question-card">
      <div className="question-header">
        <div>
          <div className="eyebrow">Question</div>
          <h1>{question.title}</h1>
          <p className="question-description">
            {question.description}
          </p>
        </div>
        <div className="question-badges">
          <span className="badge">uuid: {question.id}</span>
        </div>
      </div>
    </section>
  );
}

export default QuestionView;
