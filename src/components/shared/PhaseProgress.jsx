import { Check } from "lucide-react";

const PHASES = [
  { id: "intake", label: "Intake", phase: "intake" },
  { id: "primitives", label: "AI Use Cases", phase: "primitives" },
  { id: "playbook", label: "Change Strategy", phase: "playbook" },
];

// commitment maps to 3 (past all steps) so all 3 show as done on Review
const ORDER = { intake: 0, "generating-primitives": 0, primitives: 1, "generating-playbook": 1, playbook: 2, commitment: 3 };

export default function PhaseProgress({ phase, dispatch, isGenerating }) {
  const current = ORDER[phase] ?? 0;

  const handleClick = (p, i) => {
    if (isGenerating) return;
    if (i < current && dispatch) {
      dispatch({ type: "SET_PHASE", phase: p.phase });
    }
  };

  return (
    <div className="phase-progress">
      {PHASES.map((p, i) => {
        const isDone = i < current;
        const isActive = i === current;
        const isGen = isActive && isGenerating;
        const isClickable = isDone && dispatch && !isGenerating;

        return (
          <div key={p.id} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && <div className="phase-connector" />}
            <button
              type="button"
              onClick={() => handleClick(p, i)}
              className={`phase-step ${isGen ? "phase-step-generating" : isActive ? "phase-step-active" : isDone ? "phase-step-done" : ""} ${isClickable ? "phase-step-clickable" : ""}`}
              style={{ cursor: isClickable ? "pointer" : "default" }}
              aria-label={`${p.label}${isDone ? " (completed - click to return)" : isActive ? " (current)" : ""}`}
            >
              <span className="phase-step-number">
                {isDone ? <Check size={11} strokeWidth={3} /> : (i + 1)}
              </span>
              {isGen && <span className="phase-step-pulse" />}
              <span className="phase-step-label">{p.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
