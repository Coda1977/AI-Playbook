import { useMemo } from "react";
import { ArrowLeft, Download, Star } from "lucide-react";
import { C } from "../../config/constants";
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
        {synthesis.lede}
      </div>

      {(synthesis.storylines || []).map((s, i) => (
        <div key={i} className="synthesis-story animate-fade-in" style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
          <div className="synthesis-story-eyebrow">
            <span className="synthesis-story-num">{String(i + 1).padStart(2, "0")}</span>
            {s.eyebrowName}
          </div>
          <h2 className="synthesis-story-headline">{s.headline}</h2>
          <div className="synthesis-thesis">{s.thesis}</div>
          <div className="synthesis-prose">
            {(s.prose || []).map((p, pi) => <p key={pi}>{p}</p>)}
          </div>
          {((s.useCases && s.useCases.length > 0) || (s.actions && s.actions.length > 0)) && (
            <div className="synthesis-evidence">
              <div>
                <div className="synthesis-col-label">
                  AI Use Cases <span className="synthesis-col-count">&middot; {(s.useCases || []).length}</span>
                </div>
                <ul className="synthesis-col-list">
                  {(s.useCases || []).map((u, ui) => (
                    <li key={ui}>
                      <Star size={14} fill={C.accentGlow} color={C.accentGlow} className="synthesis-star-icon" />
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="synthesis-col-label">
                  Change Actions <span className="synthesis-col-count">&middot; {(s.actions || []).length}</span>
                </div>
                <ul className="synthesis-col-list">
                  {(s.actions || []).map((a, ai) => (
                    <li key={ai}>
                      <Star size={14} fill={C.accentGlow} color={C.accentGlow} className="synthesis-star-icon" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="synthesis-thisweek animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="synthesis-thisweek-label">This Week</div>
        <h3 className="synthesis-thisweek-title">Three concrete starts</h3>
        <ol className="synthesis-thisweek-list">
          {(synthesis.thisWeek || []).map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      </div>

      <div className="synthesis-actions no-print animate-fade-in" style={{ animationDelay: "0.4s" }}>
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
