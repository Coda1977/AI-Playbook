import { Check } from "lucide-react";

const PHASES = [
  { id: "intake", label: "Intake", phase: "intake" },
  { id: "primitives", label: "AI Use Cases", phase: "primitives" },
  { id: "playbook", label: "Change Strategy", phase: "playbook" },
  { id: "commitment", label: "Review", phase: "commitment" },
];

const ORDER = { intake: 0, "generating-primitives": 0, primitives: 1, "generating-playbook": 1, playbook: 2, commitment: 3 };

export default function PhaseProgress({ phase, dispatch }) {
  const current = ORDER[phase] ?? 0;

  const handleClick = (p, i) => {
    // Only allow navigating back to completed phases
    if (i < current && dispatch) {
      dispatch({ type: "SET_PHASE", phase: p.phase });
    }
  };

  return (
    <div className="phase-progress">
      {PHASES.map((p, i) => {
        const isDone = i < current;
        const isActive = i === current;
        const isClickable = isDone && dispatch;

        return (
          <div key={p.id} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && <div className="phase-connector" />}
            <button
              type="button"
              onClick={() => handleClick(p, i)}
              className={`phase-step ${isActive ? "phase-step-active" : isDone ? "phase-step-done" : ""} ${isClickable ? "phase-step-clickable" : ""}`}
              style={{ cursor: isClickable ? "pointer" : "default" }}
              aria-label={`${p.label}${isDone ? " (completed - click to return)" : isActive ? " (current)" : ""}`}
            >
              {isDone ? <Check size={12} /> : null}
              <span>{p.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
