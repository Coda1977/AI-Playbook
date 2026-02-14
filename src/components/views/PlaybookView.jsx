import { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { RULES } from "../../config/rules";
import { FlashProvider } from "../../context/AppContext";
import RuleSection from "../playbook/RuleSection";
import ChatDrawer from "../shared/ChatDrawer";

export default function PlaybookView({ state, dispatch, onStartOver }) {
  const [activeRule, setActiveRule] = useState(null);
  const chatOpen = activeRule !== null;

  const totalActions = RULES.reduce((sum, r) => sum + (state.plan[r.id] || []).length, 0);
  const rulesWithActions = RULES.filter((r) => (state.plan[r.id] || []).length > 0).length;
  const starred = RULES.reduce((sum, r) => sum + (state.plan[r.id] || []).filter((a) => a.starred).length, 0);

  return (
    <FlashProvider>
      <div className="canvas-layout">
        <div className="canvas-rules">
          <div className="canvas-inner">
            <div className="canvas-orientation animate-fade-in">
              <div className="orientation-stats">
                <span className="orientation-stat"><strong>{totalActions}</strong> actions</span>
                <span className="orientation-dot">&middot;</span>
                <span className="orientation-stat"><strong>{rulesWithActions}</strong> of 5 rules</span>
                {starred > 0 && (
                  <>
                    <span className="orientation-dot">&middot;</span>
                    <span className="orientation-stat"><strong>{starred}</strong> starred</span>
                  </>
                )}
              </div>
              <p className="orientation-hint">Star your priorities. Go deeper on any rule. Make this yours.</p>
            </div>

            <div className="rule-list">
              {RULES.map((r, i) => (
                <RuleSection
                  key={r.id}
                  rule={r}
                  actions={state.plan[r.id] || []}
                  dispatch={dispatch}
                  isActive={activeRule?.id === r.id}
                  onGoDeeper={setActiveRule}
                  delay={i * 0.05}
                  isLast={i === RULES.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Gate -- sticky bottom bar */}
          <div className="gate-bar">
            <div className="gate-left">
              <button onClick={onStartOver} className="btn-ghost btn-sm">
                <RotateCcw size={12} /> Start over
              </button>
              <div className="gate-counter">
                <span><strong>{totalActions}</strong> actions across <strong>{rulesWithActions}</strong> rules{starred > 0 && <> &middot; <strong>{starred}</strong> starred</>}</span>
              </div>
            </div>
            <button
              onClick={() => dispatch({ type: "SET_PHASE", phase: "commitment" })}
              className="btn-gate btn-gate-active"
            >
              Continue to Review <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {chatOpen && (
          <>
            <div onClick={() => setActiveRule(null)} className="chat-backdrop" />
            <div className="chat-panel">
              <ChatDrawer
                key={activeRule.id}
                type="playbook"
                item={activeRule}
                state={state}
                dispatch={dispatch}
                onClose={() => setActiveRule(null)}
              />
            </div>
          </>
        )}
      </div>
    </FlashProvider>
  );
}
