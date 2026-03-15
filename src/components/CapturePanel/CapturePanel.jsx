import { useCaptureConsole } from "./useCaptureConsole";

function CapturePanel({ onCapture }) {
  const { lines, isCapturing, handleCapture, consoleRef } =
    useCaptureConsole(onCapture);

  return (
    <section className="capture-panel">
      <div className="capture-actions">
        <button
          type="button"
          className="primary capture-button"
          onClick={handleCapture}
          disabled={isCapturing}
        >
          {isCapturing ? "Capturing..." : "Capture"}
        </button>
      </div>
      <div className="capture-console">
        <div className="capture-console-title">Console</div>
        <pre className="capture-console-output" ref={consoleRef}>
          {lines.length === 0
            ? "No captures yet. Click Capture to log API response values."
            : lines.join("\n\n")}
        </pre>
      </div>
    </section>
  );
}

export default CapturePanel;
