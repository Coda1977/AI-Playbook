import {
  Star,
  ArrowLeft,
  Download,
  Printer,
  Check,
  RotateCcw,
  Sparkles,
  FileText,
} from "lucide-react";
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
      <div className="commitment-hero animate-fade-in">
        <div className="commitment-header-print">
          <div className="intake-label">AI Playbook</div>
        </div>
        <h1 className="commitment-title" style={{ color: C.white }}>
          My AI Journey
        </h1>
        <p
          className="commitment-role"
          style={{ color: "rgba(255,255,255,0.55)" }}
          title={intake.role}
        >
          {intake.role} &middot; {date}
        </p>
      </div>

      {hasAnything && (
        <div
          className="synthesis-cta no-print animate-fade-in"
          style={{ animationDelay: "0.04s" }}
        >
          <div className="synthesis-cta-text">
            <div className="synthesis-cta-eyebrow">
              {synthesisStale
                ? "Plan Changed"
                : hasSynthesis
                  ? "Your Big Move"
                  : "New"}
            </div>
            <h2 className="synthesis-cta-title">
              {synthesisStale
                ? "Your big move is out of date"
                : hasSynthesis
                  ? "View your big move"
                  : "Synthesize this into one plan"}
            </h2>
            <p className="synthesis-cta-desc">
              {synthesisStale ? (
                <>
                  You changed ideas, actions, or stars since it was generated.
                  Regenerate it from your current priorities, or{" "}
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: "SET_PHASE", phase: "synthesis" })
                    }
                    className="btn-reset-link"
                    style={{ display: "inline", padding: 0 }}
                  >
                    view the previous version
                  </button>
                  .
                </>
              ) : hasSynthesis ? (
                "Open the narrative the AI synthesized from your starred priorities."
              ) : (
                "See the one big move that ties your starred priorities together, with concrete actions to start tomorrow."
              )}
            </p>
          </div>
          <button
            onClick={handleSynthesisClick}
            className="btn-primary btn-lg synthesis-cta-btn"
          >
            {synthesisStale ? (
              <>
                <Sparkles size={16} /> Regenerate My Big Move
              </>
            ) : hasSynthesis ? (
              <>
                <FileText size={16} /> View My Big Move
              </>
            ) : (
              <>
                <Sparkles size={16} /> Find My Big Move
              </>
            )}
            <span className="badge-experimental">Experimental</span>
          </button>
        </div>
      )}

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
          {/* 3-column stat grid */}
          <div
            className="summary-grid no-print animate-fade-in"
            style={{ animationDelay: "0.06s" }}
          >
            <article className="stat">
              <strong>{allPrimitiveIdeas.length}</strong>
              <span>AI ideas</span>
            </article>
            <article className="stat">
              <strong>{allActions.length}</strong>
              <span>{allActions.length === 1 ? "action" : "actions"}</span>
            </article>
            <article className="stat">
              <strong>
                {starredPrimitives.length + starredActions.length}
              </strong>
              <span>starred priorities</span>
            </article>
          </div>

          {/* Priorities box -- starred items only */}
          {(starredPrimitives.length > 0 || starredActions.length > 0) && (
            <div
              className="commitment-priorities animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="commitment-priorities-label">Your Priorities</div>
              <div className="commitment-actions">
                {starredPrimitives.map((i) => (
                  <div key={i.id} className="commitment-priority-item">
                    <Star
                      size={16}
                      fill={C.accentGlow}
                      color={C.accentGlow}
                      style={{ flexShrink: 0, marginTop: 3 }}
                    />
                    <span>
                      {i.text}{" "}
                      <span className="commitment-rule-ref">
                        -- {i.category.title}
                      </span>
                    </span>
                  </div>
                ))}
                {starredActions.map((a) => (
                  <div key={a.id} className="commitment-priority-item">
                    <Star
                      size={16}
                      fill={C.accentGlow}
                      color={C.accentGlow}
                      style={{ flexShrink: 0, marginTop: 3 }}
                    />
                    <span>
                      {a.text}{" "}
                      <span className="commitment-rule-ref">
                        -- Rule {a.rule.number}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -- Full detail: My AI Use Cases -- */}
          <h2
            className="commitment-section-title animate-fade-in"
            style={{ animationDelay: "0.14s" }}
          >
            My AI Use Cases
          </h2>

          {CATEGORIES.map((c, idx) => {
            const ideas = primitives[c.id] || [];
            if (ideas.length === 0) return null;
            return (
              <div
                key={c.id}
                className="commitment-rule animate-fade-in"
                style={{ animationDelay: `${0.16 + idx * 0.03}s` }}
              >
                <div
                  className="commitment-rule-number"
                  style={{ color: c.color || C.accent }}
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

          {/* -- Rule-anchored Change Playbook -- */}
          {allActions.length > 0 && (
            <>
              <div className="commitment-divider" />
              <h2
                className="commitment-section-title animate-fade-in"
                style={{ animationDelay: "0.3s", marginTop: 0 }}
              >
                My Change Playbook
              </h2>

              {RULES.map((r, i) => {
                const acts = plan[r.id] || [];
                if (acts.length === 0) return null;
                return (
                  <div
                    key={r.id}
                    className="commitment-rule-block animate-fade-in"
                    style={{ animationDelay: `${0.32 + i * 0.04}s` }}
                  >
                    <div className="commitment-rule-anchor">
                      <span
                        className="commitment-rule-num"
                        style={{ color: r.color || C.accent }}
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

          <footer
            className="commitment-buttons no-print animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            <button
              onClick={() => dispatch({ type: "SET_PHASE", phase: "playbook" })}
              className="btn-reset-link commitment-back-link"
            >
              <ArrowLeft size={14} /> Back to edit
            </button>
            <div className="commitment-export-group">
              <button
                onClick={() => exportPrimitivesDocx(state)}
                className="btn-ghost btn-lg"
              >
                <Download size={15} /> Use cases (.docx)
              </button>
              <button
                onClick={() => exportPlaybookDocx(state)}
                className="btn-ghost btn-lg"
              >
                <Download size={15} /> Strategy (.docx)
              </button>
              <button
                onClick={handleSynthesisClick}
                className="btn-ghost btn-lg"
              >
                {hasSynthesis && !synthesisStale ? (
                  <FileText size={15} />
                ) : (
                  <Sparkles size={15} />
                )}
                {synthesisStale
                  ? " Regenerate big move"
                  : hasSynthesis
                    ? " View big move"
                    : " Find big move"}
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary btn-lg"
              >
                <Printer size={15} /> Print / Save as PDF
              </button>
            </div>
          </footer>

          <div
            className="commitment-reset no-print animate-fade-in"
            style={{ animationDelay: "0.55s" }}
          >
            <button onClick={onStartOver} className="btn-reset-link">
              <RotateCcw size={13} /> Start over with new intake
            </button>
          </div>
        </>
      )}
    </div>
  );
}
