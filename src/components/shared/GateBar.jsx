export default function GateBar({ left, hint, children }) {
  return (
    <footer className="gate-bar no-print">
      <span className="gate-left">{left}</span>
      {hint && <span className="gate-hint">{hint}</span>}
      <span className="gate-actions">{children}</span>
    </footer>
  );
}
