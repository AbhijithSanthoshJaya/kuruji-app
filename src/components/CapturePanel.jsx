import { useEffect, useRef, useState } from "react";

function CapturePanel({ onCapture }) {
  const [lines, setLines] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const consoleRef = useRef(null);

  const addLine = (text) => {
    const now = new Date().toLocaleTimeString();
    setLines((prev) => [...prev, `[${now}] ${text}`].slice(-100));
  };

  useEffect(() => {
    if (!consoleRef.current) {
      return;
    }
    consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [lines]);

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      await onCapture((eventData) => {
        switch (eventData.type) {
          case "log":
            addLine(`LOG: ${eventData.message}`);
            break;
          case "status":
            addLine(`STATUS: ${eventData.status}`);
            break;
          case "complete":
            addLine(
              `COMPLETE: ${eventData.question_title} (answer: ${eventData.answer_id})`,
            );
            break;
          case "error":
            addLine(`ERROR: ${eventData.error}`);
            break;
          default:
            addLine(JSON.stringify(eventData));
        }
      });
    } catch (err) {
      addLine(`ERROR: ${err.message}`);
    } finally {
      setIsCapturing(false);
    }
  };
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
