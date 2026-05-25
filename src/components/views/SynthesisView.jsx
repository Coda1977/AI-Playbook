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

  const narrativeText = synthesis.narrative || synthesis.lede || "";

  return (
    <div className="synthesis-container">
      <div className="synthesis-hero animate-fade-in">
        <div className="synthesis-hero-eyebrow">
          My One-Page Plan
          <span className="synthesis-experimental">Experimental</span>
        </div>
        <h1 className="synthesis-title">{synthesis.title}</h1>
        <div className="synthesis-meta" title={intake.role}>
          {intake.role}{date ? <> &middot; {date}</> : null}
        </div>
      </div>

      <div className="synthesis-lede animate-fade-in" style={{ animationDelay: "0.06s" }}>
        {narrativeText}
      </div>

      <div className="synthesis-thisweek animate-fade-in" style={{ animationDelay: "0.12s" }}>
        <div className="synthesis-thisweek-label">This Week</div>
        <h3 className="synthesis-thisweek-title">Three concrete starts</h3>
        <ol className="synthesis-thisweek-list">
          {(synthesis.thisWeek || []).map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      </div>

      <div className="synthesis-fullplan animate-fade-in" style={{ animationDelay: "0.18s", background: "var(--color-surface)", border: "1px solid var(--color-light-gray)", borderRadius: 8, padding: "16px 20px", marginTop: 12, marginBottom: 28, fontSize: 13, color: "var(--color-dark-gray)", lineHeight: 1.6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray-500)", marginBottom: 8 }}>Your full plan</div>
        Your starred use cases and change actions are saved on the Review screen. Export to Word to get the complete version.
      </div>

      <div className="synthesis-actions no-print animate-fade-in" style={{ animationDelay: "0.24s" }}>
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
