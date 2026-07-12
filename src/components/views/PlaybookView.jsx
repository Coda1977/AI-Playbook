import { useState, useEffect } from "react";
import { ChevronRight, RotateCcw, Star } from "lucide-react";
import { RULES } from "../../config/rules";
import { CATEGORIES } from "../../config/categories";
import { MIN_STARS_FOR_REVIEW, C } from "../../config/constants";
import { FlashProvider } from "../../context/AppContext";
import RuleSection from "../playbook/RuleSection";
import ChatDrawer from "../shared/ChatDrawer";
import GateBar from "../shared/GateBar";
import BoardRail from "../shared/BoardRail";
import CommitmentTray from "../shared/CommitmentTray";

export default function PlaybookView({ state, dispatch, onStartOver }) {
  const [focusedId, setFocusedId] = useState(RULES[0].id);
  const [activeRule, setActiveRule] = useState(null);
  const [chatExpanded, setChatExpanded] = useState(false);

  const totalActions = RULES.reduce(
    (sum, r) => sum + (state.plan[r.id] || []).length,
    0,
  );
  const starred = RULES.reduce(
    (sum, r) => sum + (state.plan[r.id] || []).filter((a) => a.starred).length,
    0,
  );
  // Starred actions anchor the Big Move synthesis, so Review requires them,
  // mirroring the star gate on the use-cases phase.
  const canContinue = starred >= MIN_STARS_FOR_REVIEW;

  // Flat-mapped starred actions across every rule, each tagged with its
  // rule's source label for the tray.
  const starredActions = RULES.flatMap((r) =>
    (state.plan[r.id] || [])
      .filter((a) => a.starred)
      .map((a) => ({ ...a, sourceLabel: `Rule ${r.number} · ${r.name}` })),
  );
  // Starred use cases from Phase 2 ride along as read-only context.
  const starredIdeas = CATEGORIES.flatMap((c) =>
    (state.primitives[c.id] || [])
      .filter((i) => i.starred)
      .map((i) => ({ ...i, sourceLabel: c.title })),
  );
  const totalStarred = starredActions.length + starredIdeas.length;

  const focusedRule = RULES.find((r) => r.id === focusedId) || RULES[0];
  const focusedIndex = RULES.findIndex((r) => r.id === focusedId);
  const nextRule = RULES[(focusedIndex + 1) % RULES.length];

  // Switching rail rule closes any open chat instead of leaving it pinned to
  // a rule that's no longer in focus.
  useEffect(() => {
    setActiveRule(null);
    setChatExpanded(false);
  }, [focusedId]);

  return (
    <FlashProvider>
      <div className="canvas-layout">
        <div className="canvas-rules playbook-canvas">
          <div className="canvas-inner canvas-inner-board">
            <h2 className="board-title">Change Strategy</h2>
            <p className="board-coach">
              Star your priorities. Go deeper on any rule. Make this yours.
            </p>

            <div className="board3">
              <BoardRail
                label="Five rules"
                items={RULES.map((r) => ({
                  id: r.id,
                  number: r.number,
                  title: r.name,
                  count: (state.plan[r.id] || []).length,
                  starredCount: (state.plan[r.id] || []).filter(
                    (a) => a.starred,
                  ).length,
                }))}
                activeId={focusedId}
                onSelect={setFocusedId}
                note="10 actions across 5 research-backed rules. Star at least 3 to build your Big Move."
              />

              <section className="board-focus">
                <RuleSection
                  rule={focusedRule}
                  actions={state.plan[focusedId] || []}
                  dispatch={dispatch}
                  onGoDeeper={setActiveRule}
                  focusIndex={focusedIndex}
                  total={RULES.length}
                  onNext={() => setFocusedId(nextRule.id)}
                  nextName={nextRule.name}
                />

                {activeRule && activeRule.id === focusedId && (
                  <div
                    className={`chat-inline${chatExpanded ? " chat-expanded" : ""}`}
                  >
                    <ChatDrawer
                      key={activeRule.id}
                      type="playbook"
                      item={activeRule}
                      state={state}
                      dispatch={dispatch}
                      onClose={() => {
                        setActiveRule(null);
                        setChatExpanded(false);
                      }}
                      expanded={chatExpanded}
                      onToggleExpand={() => setChatExpanded((v) => !v)}
                    />
                  </div>
                )}
              </section>

              <CommitmentTray
                title="Your priorities"
                countLabel={`${totalStarred} starred`}
                groups={[
                  {
                    label: `Strategy actions · ${starredActions.length}`,
                    items: starredActions,
                  },
                  {
                    label: `From your use cases · ${starredIdeas.length}`,
                    items: starredIdeas,
                  },
                ]}
                status={
                  <p className="tray-status">
                    <b>{starred} actions starred</b> ·{" "}
                    {starred >= MIN_STARS_FOR_REVIEW
                      ? "review unlocked."
                      : `review unlocks at ${MIN_STARS_FOR_REVIEW}.`}
                  </p>
                }
                emptyText="Star actions and they collect here."
              />
            </div>
          </div>

          {/* Gate - direct child of canvas-rules for sticky to work */}
          <GateBar
            left={
              <>
                <b>{totalActions}</b> actions · <b>{RULES.length}</b> rules ·{" "}
                <Star
                  size={14}
                  fill={C.star}
                  color={C.star}
                  style={{ verticalAlign: "text-bottom" }}
                />{" "}
                <b>{starred}</b> starred
              </>
            }
            hint="Ready when you are"
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
              Continue to review <ChevronRight size={16} />
            </button>
          </GateBar>
        </div>
      </div>
    </FlashProvider>
  );
}
