import { useState } from "react";
import { ChevronRight, RotateCcw, Star } from "lucide-react";
import { RULES } from "../../config/rules";
import { MIN_STARS_FOR_REVIEW, C } from "../../config/constants";
import { FlashProvider } from "../../context/AppContext";
import RuleSection from "../playbook/RuleSection";
import ChatDrawer from "../shared/ChatDrawer";
import GateBar from "../shared/GateBar";

export default function PlaybookView({ state, dispatch, onStartOver }) {
  const [activeRule, setActiveRule] = useState(null);
  const chatOpen = activeRule !== null;

  const totalActions = RULES.reduce(
    (sum, r) => sum + (state.plan[r.id] || []).length,
    0,
  );
  const rulesWithActions = RULES.filter(
    (r) => (state.plan[r.id] || []).length > 0,
  ).length;
  const starred = RULES.reduce(
    (sum, r) => sum + (state.plan[r.id] || []).filter((a) => a.starred).length,
    0,
  );
  // Starred actions anchor the Big Move synthesis, so Review requires them,
  // mirroring the star gate on the use-cases phase.
  const canContinue = starred >= MIN_STARS_FOR_REVIEW;

  return (
    <FlashProvider>
      <div className="canvas-layout">
        <div className="canvas-rules playbook-canvas">
          <div className="canvas-inner">
            <div className="canvas-orientation animate-fade-in">
              <div className="orientation-stats">
                <span className="orientation-stat">
                  <strong>{totalActions}</strong> actions
                </span>
                <span className="orientation-dot">&middot;</span>
                <span className="orientation-stat">
                  <strong>{rulesWithActions}</strong> of 5 rules
                </span>
                {starred > 0 && (
                  <>
                    <span className="orientation-dot">&middot;</span>
                    <span className="orientation-stat">
                      <strong>{starred}</strong> starred
                    </span>
                  </>
                )}
              </div>
              <p className="orientation-hint">
                Star your priorities. Go deeper on any rule. Make this yours.
              </p>
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
          <GateBar
            left={
              <>
                <Star
                  size={14}
                  fill={C.accentGlow}
                  color={C.accentGlow}
                  style={{ verticalAlign: "text-bottom" }}
                />{" "}
                <strong>{starred}</strong> of {totalActions}
              </>
            }
            hint={
              starred === 0
                ? "Star the actions that matter most to you"
                : starred < MIN_STARS_FOR_REVIEW
                  ? `Star at least ${MIN_STARS_FOR_REVIEW} to continue`
                  : "Ready when you are"
            }
          >
            <button onClick={onStartOver} className="btn-pill-ghost">
              <RotateCcw size={12} /> Start over
            </button>
            <button
              onClick={
                canContinue
                  ? () => dispatch({ type: "SET_PHASE", phase: "commitment" })
                  : undefined
              }
              className="btn-pill"
              disabled={!canContinue}
            >
              Continue to Review <ChevronRight size={16} />
            </button>
          </GateBar>
        </div>

        {chatOpen && (
          <>
            <div
              onClick={() => setActiveRule(null)}
              className="chat-backdrop"
            />
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
