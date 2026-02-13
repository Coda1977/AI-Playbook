import { Check } from "lucide-react";

const PHASES = [
  { id: "intake", label: "Intake" },
  { id: "primitives", label: "AI Use Cases" },
  { id: "playbook", label: "Change Strategy" },
  { id: "commitment", label: "Review" },
];

const ORDER = { intake: 0, "generating-primitives": 0, primitives: 1, "generating-playbook": 1, playbook: 2, commitment: 3 };

export default function PhaseProgress({ phase }) {
  const current = ORDER[phase] ?? 0;

  return (
    <div className="phase-progress">
      {PHASES.map((p, i) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center" }}>
          {i > 0 && <div className="phase-connector" />}
          <div className={`phase-step ${i === current ? "phase-step-active" : i < current ? "phase-step-done" : ""}`}>
            {i < current ? <Check size={12} /> : null}
            <span>{p.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
