function FullscreenGate({ onEnter }) {
  return (
    <main className="fullscreen-gate" aria-label="Fullscreen gate" onClick={onEnter} />
  );
}

export default FullscreenGate;
