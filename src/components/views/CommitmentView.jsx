import { useState, useRef, useEffect } from "react";
import { Star, ArrowLeft, Download, Printer, Check, RotateCcw } from "lucide-react";
import { CATEGORIES } from "../../config/categories";
import { RULES } from "../../config/rules";
import { C } from "../../config/constants";
import { exportPrimitivesDocx, exportPlaybookDocx } from "../../utils/export";

export default function CommitmentView({
  state,
  dispatch,
  onStartOver,
  onGenerateSynthesis,
}) {
  const { primitives, plan, intake } = state;
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [exportsOpen, setExportsOpen] = useState(false);
  const exportsRef = useRef(null);

  useEffect(() => {
    if (!exportsOpen) return;
    const onDocClick = (e) => {
      if (exportsRef.current && !exportsRef.current.contains(e.target)) {
        setExportsOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setExportsOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [exportsOpen]);

  // Primitives
  const allPrimitiveIdeas = CATEGORIES.flatMap((c) =>
    (primitives[c.id] || []).map((i) => ({ ...i, category: c })),
  );
  const starredPrimitives = allPrimitiveIdeas.filter((i) => i.starred);

  // Playbook
  const allActions = RULES.flatMap((r) =>
    (plan[r.id] || []).map((a) => ({ ...a, rule: r })),
  );
  const starredActions = allActions.filter((a) => a.starred);

  const hasSynthesis = !!state.synthesis;
  // The Big Move was generated from a snapshot of ideas/actions/stars. Any
  // edit since then makes it stale; offer regeneration instead of showing an
  // outdated plan as if it were current.
  const synthesisStale =
    hasSynthesis &&
    (state.synthesisVersion || 0) !== (state.contentVersion || 0);
  const handleSynthesisClick = () => {
    if (hasSynthesis && !synthesisStale) {
      dispatch({ type: "SET_PHASE", phase: "synthesis" });
    } else if (onGenerateSynthesis) {
      onGenerateSynthesis();
    }
  };

  const hasAnything = allPrimitiveIdeas.length > 0 || allActions.length > 0;

  return (
    <div className="commitment-container">
      <div className="commitment-header-print">
        <div className="intake-label">AI Playbook</div>
      </div>

      <h1 className="intake-title animate-fade-in">My AI Journey</h1>
      <p className="commitment-byline animate-fade-in" title={intake.role}>
        {intake.role} &middot; {date}
      </p>

      {!hasAnything ? (
        <div
          className="commitment-empty animate-fade-in"
          style={{ animationDelay: "0.08s" }}
        >
          <p>No content yet. Go back and add some ideas or actions.</p>
          <button
            onClick={() => dispatch({ type: "SET_PHASE", phase: "primitives" })}
            className="btn-ghost"
          >
            <ArrowLeft size={14} /> Back to Discovery
          </button>
        </div>
      ) : (
        <>
          {/* Priorities: starred use cases + starred actions, two columns */}
          <div
            className="prior-cols no-print animate-fade-in"
            style={{ animationDelay: "0.06s" }}
          >
            <div className="prior-card">
              <h3>AI Use Cases</h3>
              {starredPrimitives.length === 0 ? (
                <p className="prior-empty">No starred use cases yet.</p>
              ) : (
                starredPrimitives.map((i) => (
                  <div key={i.id} className="prow">
                    <span className="prow-star">★</span>
                    <p>{i.text}</p>
                    <span className="prow-src">{i.category.title}</span>
                  </div>
                ))
              )}
            </div>
            <div className="prior-card">
              <h3>Change Strategy</h3>
              {starredActions.length === 0 ? (
                <p className="prior-empty">No starred actions yet.</p>
              ) : (
                starredActions.map((a) => (
                  <div key={a.id} className="prow">
                    <span className="prow-star">★</span>
                    <p>{a.text}</p>
                    <span className="prow-src">Rule {a.rule.number}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions row: back / more exports / download PDF */}
          <div
            className="review-actions no-print animate-fade-in"
            style={{ animationDelay: "0.12s" }}
          >
            <button
              onClick={() => dispatch({ type: "SET_PHASE", phase: "playbook" })}
              className="btn-reset-link review-back"
            >
              <ArrowLeft size={14} /> Back to edit
            </button>
            <div className="exports-menu" ref={exportsRef}>
              <button
                type="button"
                onClick={() => setExportsOpen((v) => !v)}
                className="btn-pill-ghost"
                aria-haspopup="true"
                aria-expanded={exportsOpen}
              >
                More exports ▾
              </button>
              {exportsOpen && (
                <div className="exports-menu-panel animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      exportPrimitivesDocx(state);
                      setExportsOpen(false);
                    }}
                    className="exports-menu-item"
                  >
                    <Download size={14} /> Use Cases (.docx)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportPlaybookDocx(state);
                      setExportsOpen(false);
                    }}
                    className="exports-menu-item"
                  >
                    <Download size={14} /> Strategy (.docx)
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => window.print()} className="btn-pill">
              <Printer size={15} /> Print / Save as PDF
            </button>
          </div>

          <div
            className="commitment-reset no-print animate-fade-in"
            style={{ animationDelay: "0.16s" }}
          >
            <button onClick={onStartOver} className="btn-reset-link">
              <RotateCcw size={13} /> Start over with new intake
            </button>
          </div>

          {/* -- Full detail: kept in the DOM for print/export fidelity,
              hidden on screen since the columns above summarize it. -- */}
          <h2 className="commitment-section-title print-only">
            My AI Use Cases
          </h2>

          {CATEGORIES.map((c) => {
            const ideas = primitives[c.id] || [];
            if (ideas.length === 0) return null;
            return (
              <div key={c.id} className="commitment-rule print-only">
                <div
                  className="commitment-rule-number"
                  style={{ color: C.accent }}
                >
                  Category {c.number}
                </div>
                <h3 className="commitment-rule-name">{c.title}</h3>
                <div className="commitment-actions">
                  {ideas.map((i) => (
                    <div key={i.id} className="commitment-action">
                      {i.starred ? (
                        <Star
                          size={16}
                          fill={C.accentGlow}
                          color={C.accentGlow}
                          style={{ flexShrink: 0, marginTop: 3 }}
                        />
                      ) : (
                        <div className="commitment-bullet">
                          <Check size={12} />
                        </div>
                      )}
                      <span>{i.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {allActions.length > 0 && (
            <>
              <div className="commitment-divider print-only" />
              <h2
                className="commitment-section-title print-only"
                style={{ marginTop: 0 }}
              >
                My Change Playbook
              </h2>

              {RULES.map((r) => {
                const acts = plan[r.id] || [];
                if (acts.length === 0) return null;
                return (
                  <div key={r.id} className="commitment-rule-block print-only">
                    <div className="commitment-rule-anchor">
                      <span
                        className="commitment-rule-num"
                        style={{ color: C.accent }}
                      >
                        {String(r.number).padStart(2, "0")}
                      </span>
                      <span style={{ color: C.darkGray, fontSize: 18 }}>
                        &middot;
                      </span>
                      <span className="commitment-rule-anchor-name">
                        {r.name}
                      </span>
                    </div>
                    <div className="commitment-rule-actions">
                      {acts.map((a) => (
                        <div key={a.id} className="commitment-action">
                          {a.starred ? (
                            <Star
                              size={16}
                              fill={C.accentGlow}
                              color={C.accentGlow}
                              style={{ flexShrink: 0, marginTop: 3 }}
                            />
                          ) : (
                            <div className="commitment-bullet">
                              <Check size={12} />
                            </div>
                          )}
                          <span>{a.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          <div className="commitment-footer-print">
            <p>Generated {date} &middot; AI Playbook</p>
          </div>

          {/* Big move -- last element on the page */}
          <div
            className="bigmove-callout no-print animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div>
              <h3>Your big move</h3>
              <p className="bigmove-callout-desc">
                Open the narrative the AI synthesized from your starred
                priorities.
                {synthesisStale && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({ type: "SET_PHASE", phase: "synthesis" })
                      }
                      className="btn-reset-link"
                      style={{ display: "inline-flex", padding: 0 }}
                    >
                      view the previous version
                    </button>
                  </>
                )}
              </p>
            </div>
            <button
              onClick={handleSynthesisClick}
              className="btn-pill on-dark"
            >
              {synthesisStale
                ? "Regenerate →"
                : hasSynthesis
                  ? "Open →"
                  : "Generate →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
