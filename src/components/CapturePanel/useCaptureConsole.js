import { useCallback, useEffect, useRef, useState } from "react";

export function useCaptureConsole(onCapture) {
  const [lines, setLines] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const consoleRef = useRef(null);

  const addLine = useCallback((text) => {
    const now = new Date().toLocaleTimeString();
    setLines((prev) => [...prev, `[${now}] ${text}`].slice(-100));
  }, []);

  useEffect(() => {
    if (!consoleRef.current) {
      return;
    }
    consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [lines]);

  const handleCapture = useCallback(async () => {
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
  }, [onCapture, addLine]);

  return { lines, isCapturing, handleCapture, consoleRef };
}
