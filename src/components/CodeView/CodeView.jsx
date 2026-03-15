function CodeView({ title, code }) {
  return (
    <div className="code-block">
      <div className="code-title">{title}</div>
      <pre className="code-scroll">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default CodeView;
