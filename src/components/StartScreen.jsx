function StartScreen({ onStart }) {
  return (
    <main className="canvas start-screen">
      <section className="question-card">
        <div className="question-header">
          <div>
            <div className="eyebrow">Welcome</div>
            <h1>Start a Question Session</h1>
            <p className="question-description">
              Click START to load questions and view answers one at a time.
            </p>
          </div>
        </div>
        <button className="primary start-button" onClick={onStart}>
          START
        </button>
      </section>
    </main>
  );
}

export default StartScreen;
