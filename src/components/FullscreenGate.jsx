function FullscreenGate({ onEnter }) {
  const handleEnter = async () => {
    // Exit fullscreen when entering the main app
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Fullscreen exit may fail; continue anyway.
      }
    }
    onEnter();
  };

  return (
    <main
      className="fullscreen-gate"
      aria-label="Fullscreen gate"
      onClick={handleEnter}
    />
  );
}

export default FullscreenGate;
