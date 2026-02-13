import { Star, ArrowLeft, Download, Check } from "lucide-react";
import { CATEGORIES } from "../../config/categories";
import { RULES } from "../../config/rules";
import { C } from "../../config/constants";

export default function CommitmentView({ state, dispatch }) {
  const { primitives, plan, intake } = state;
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Primitives
  const allPrimitiveIdeas = CATEGORIES.flatMap((c) => (primitives[c.id] || []).map((i) => ({ ...i, category: c })));
  const starredPrimitives = allPrimitiveIdeas.filter((i) => i.starred);

  // Playbook
  const allActions = RULES.flatMap((r) => (plan[r.id] || []).map((a) => ({ ...a, rule: r })));
  const starredActions = allActions.filter((a) => a.starred);

  const hasAnything = allPrimitiveIdeas.length > 0 || allActions.length > 0;

  return (
    <div className="commitment-container">
      <div className="commitment-hero animate-fade-in">
        <div className="no-print">
          <p className="commitment-step" style={{ color: "rgba(255,255,255,0.4)" }}>Step 4 of 4 -- Review</p>
        </div>
        <div className="commitment-header-print">
          <div className="intake-label">AI Playbook</div>
        </div>
        <h1 className="commitment-title" style={{ color: C.white }}>My AI Journey</h1>
        <p className="commitment-role" style={{ color: "rgba(255,255,255,0.55)" }} title={intake.role}>{intake.role} &middot; {date}</p>
      </div>

      {!hasAnything ? (
        <div className="commitment-empty animate-fade-in" style={{ animationDelay: "0.08s" }}>
          <p>No content yet. Go back and add some ideas or actions.</p>
          <button onClick={() => dispatch({ type: "SET_PHASE", phase: "primitives" })} className="btn-ghost">
            <ArrowLeft size={14} /> Back to Discovery
          </button>
        </div>
      ) : (
        <>
          {/* 3-column stat grid */}
          <div className="summary-grid no-print animate-fade-in" style={{ animationDelay: "0.06s" }}>
            <article className="stat">
              <strong>{allPrimitiveIdeas.length}</strong>
              <span>AI ideas</span>
            </article>
            <article className="stat">
              <strong>{allActions.length}</strong>
              <span>{allActions.length === 1 ? "action" : "actions"}</span>
            </article>
            <article className="stat">
              <strong>{starredPrimitives.length + starredActions.length}</strong>
              <span>starred priorities</span>
            </article>
          </div>

          {/* 2-column review: Use Cases left, Playbook right -- shows ALL items */}
          <div className="review-columns animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <article className="panel">
              <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>My AI Use Cases</h3>
              {allPrimitiveIdeas.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {allPrimitiveIdeas.map((i) => (
                    <div key={i.id} className="commitment-priority-item">
                      {i.starred ? (
                        <Star size={16} fill={C.accentGlow} color={C.accentGlow} style={{ flexShrink: 0, marginTop: 3 }} />
                      ) : (
                        <div className="commitment-bullet"><Check size={12} /></div>
                      )}
                      <span>{i.text} <span className="commitment-rule-ref">-- {i.category.title}</span></span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: C.darkGray, fontStyle: "italic" }}>No ideas yet</p>
              )}
            </article>
            <article className="panel">
              <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>My Change Playbook</h3>
              {allActions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {allActions.map((a) => (
                    <div key={a.id} className="commitment-priority-item">
                      {a.starred ? (
                        <Star size={16} fill={C.accentGlow} color={C.accentGlow} style={{ flexShrink: 0, marginTop: 3 }} />
                      ) : (
                        <div className="commitment-bullet"><Check size={12} /></div>
                      )}
                      <span>{a.text} <span className="commitment-rule-ref">-- Rule {a.rule.number}</span></span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: C.darkGray, fontStyle: "italic" }}>No actions yet</p>
              )}
            </article>
          </div>

          {/* -- Full detail: My AI Use Cases -- */}
          <h2 className="commitment-section-title animate-fade-in" style={{ animationDelay: "0.14s" }}>My AI Use Cases</h2>

          {CATEGORIES.map((c, idx) => {
            const ideas = primitives[c.id] || [];
            if (ideas.length === 0) return null;
            return (
              <div key={c.id} className="commitment-rule animate-fade-in" style={{ animationDelay: `${0.16 + idx * 0.03}s` }}>
                <div className="commitment-rule-number" style={{ color: c.color || C.accent }}>Category {c.number}</div>
                <h3 className="commitment-rule-name">{c.title}</h3>
                <div className="commitment-actions">
                  {ideas.map((i) => (
                    <div key={i.id} className="commitment-action">
                      {i.starred ? (
                        <Star size={16} fill={C.accentGlow} color={C.accentGlow} style={{ flexShrink: 0, marginTop: 3 }} />
                      ) : (
                        <div className="commitment-bullet"><Check size={12} /></div>
                      )}
                      <span>{i.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* -- Full detail: My Change Playbook -- */}
          {allActions.length > 0 && (
            <>
              <h2 className="commitment-section-title animate-fade-in" style={{ animationDelay: "0.3s" }}>My Change Playbook</h2>

              {RULES.map((r, i) => {
                const acts = plan[r.id] || [];
                return (
                  <div key={r.id} className="commitment-rule animate-fade-in" style={{ animationDelay: `${0.32 + i * 0.04}s` }}>
                    <div className="commitment-rule-number" style={{ color: r.color || C.accent }}>Rule {r.number}</div>
                    <h3 className="commitment-rule-name">{r.name}</h3>
                    {acts.length === 0 ? (
                      <p className="commitment-no-actions">No actions added</p>
                    ) : (
                      <div className="commitment-actions">
                        {acts.map((a) => (
                          <div key={a.id} className="commitment-action">
                            {a.starred ? (
                              <Star size={16} fill={C.accentGlow} color={C.accentGlow} style={{ flexShrink: 0, marginTop: 3 }} />
                            ) : (
                              <div className="commitment-bullet"><Check size={12} /></div>
                            )}
                            <span>{a.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          <div className="commitment-footer-print">
            <p>Generated {date} &middot; AI Playbook</p>
          </div>

          <div className="commitment-buttons no-print animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <button onClick={() => dispatch({ type: "SET_PHASE", phase: "playbook" })} className="btn-ghost btn-lg">
              <ArrowLeft size={15} /> Back to Edit Strategy
            </button>
            <button onClick={() => window.print()} className="btn-primary btn-lg">
              <Download size={15} /> Download as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
