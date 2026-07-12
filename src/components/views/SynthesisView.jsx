import { ArrowLeft, Download, Printer } from "lucide-react";
import { exportSynthesisDocx } from "../../utils/export";
import { truncateRole } from "../../utils/text";

export default function SynthesisView({ state, dispatch }) {
  const { synthesis, intake } = state;

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
  // Same formatting CommitmentView uses for its byline date; no separate
  // date source exists on the synthesis object.
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="synthesis-container">
      <div className="synthesis-hero animate-fade-in">
        <span className="eyebrow-badge on-dark">Your Big Move</span>
        <h1 className="synthesis-title">{title}</h1>
      </div>

      <div className="synthesis-thisweek animate-fade-in" style={{ animationDelay: "0.08s" }}>
        <ol className="synthesis-thisweek-list">
          {actions.map((item, i) => (
            <li key={i}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="synthesis-actions no-print animate-fade-in" style={{ animationDelay: "0.16s" }}>
        <div className="synthesis-footer-left">
          <span className="synthesis-byline" title={intake.role}>
            {truncateRole(intake.role)} &middot; {date}
          </span>
          <button onClick={() => dispatch({ type: "SET_PHASE", phase: "commitment" })} className="btn-reset-link">
            <ArrowLeft size={14} /> Back to Review
          </button>
        </div>
        <button onClick={() => exportSynthesisDocx(state)} className="btn-reset-link">
          <Download size={14} /> Export Word
        </button>
        <button onClick={() => window.print()} className="btn-pill on-dark">
          <Printer size={15} /> Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
