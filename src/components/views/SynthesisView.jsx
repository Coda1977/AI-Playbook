import { useMemo } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { exportSynthesisDocx } from "../../utils/export";

export default function SynthesisView({ state, dispatch }) {
  const { synthesis, intake } = state;

  const date = useMemo(() => {
    if (!synthesis || !synthesis.generatedAt) return "";
    return new Date(synthesis.generatedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [synthesis]);

  if (!synthesis) {
    return (
      <div className="commitment-empty">
        <p>No plan yet. Go back to Review and generate one.</p>
        <button onClick={() => dispatch({ type: "SET_PHASE", phase: "commitment" })} className="btn-ghost">
          <ArrowLeft size={14} /> Back to Review
        </button>
      </div>
    );
  }

  const title = synthesis.bigMoveTitle || synthesis.title || "";
  const actions = synthesis.actions || synthesis.thisWeek || [];

  return (
    <div className="synthesis-container">
      <div className="synthesis-hero animate-fade-in">
        <div className="synthesis-hero-eyebrow">
          Your Big Move
        </div>
        <h1 className="synthesis-title">{title}</h1>
        <div className="synthesis-meta" title={intake.role}>
          {intake.role}{date ? <> &middot; {date}</> : null}
        </div>
      </div>

      <div className="synthesis-thisweek animate-fade-in" style={{ animationDelay: "0.08s" }}>
        <ol className="synthesis-thisweek-list">
          {actions.map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      </div>

      <div className="synthesis-actions no-print animate-fade-in" style={{ animationDelay: "0.16s" }}>
        <button onClick={() => dispatch({ type: "SET_PHASE", phase: "commitment" })} className="btn-ghost btn-lg">
          <ArrowLeft size={15} /> Back to Review
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => exportSynthesisDocx(state)} className="btn-ghost btn-lg">
          <Download size={15} /> Export Word
        </button>
        <button onClick={() => window.print()} className="btn-primary btn-lg">
          <Download size={15} /> Download PDF
        </button>
      </div>
    </div>
  );
}
