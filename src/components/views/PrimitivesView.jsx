import { useState, useEffect, useRef } from "react";
import { ChevronRight, Star, Download, RotateCcw } from "lucide-react";
import { CATEGORIES } from "../../config/categories";
import { MIN_STARS_FOR_PLAYBOOK, C } from "../../config/constants";
import { FlashProvider } from "../../context/AppContext";
import { exportPrimitivesDocx } from "../../utils/export";
import CategorySection from "../primitives/CategorySection";
import ChatDrawer from "../shared/ChatDrawer";
import GateBar from "../shared/GateBar";
import BoardRail from "../shared/BoardRail";
import CommitmentTray from "../shared/CommitmentTray";

export default function PrimitivesView({
  state,
  dispatch,
  onContinue,
  onStartOver,
}) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [focusedId, setFocusedId] = useState(CATEGORIES[0].id);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [counterPulse, setCounterPulse] = useState(false);
  const prevStarredRef = useRef(0);
  const scrollRef = useRef(null);
  const focusPaneRef = useRef(null);
  const headingRef = useRef(null);
  // Tracks the previously-focused category so the switch effect below can
  // tell an actual switch apart from the initial mount. A plain "is this the
  // first run" boolean ref doesn't survive React StrictMode's dev-only
  // double-invoke of mount effects (the flag flips on the first invocation,
  // so the second invocation wrongly treats the mount as a "switch" and
  // steals focus); comparing against the last-seen id is idempotent no
  // matter how many times the effect fires for the same value.
  const prevFocusedIdRef = useRef(focusedId);

  const totalIdeas = CATEGORIES.reduce(
    (sum, c) => sum + (state.primitives[c.id] || []).length,
    0,
  );
  const starredCount = CATEGORIES.reduce(
    (sum, c) =>
      sum + (state.primitives[c.id] || []).filter((i) => i.starred).length,
    0,
  );
  const canContinue = starredCount >= MIN_STARS_FOR_PLAYBOOK;

  // Flat-mapped starred ideas across every category, in category order, each
  // tagged with its category title for the tray's source label.
  const allStarred = CATEGORIES.flatMap((c) =>
    (state.primitives[c.id] || [])
      .filter((i) => i.starred)
      .map((i) => ({ ...i, categoryTitle: c.title })),
  );

  const focusedCategory =
    CATEGORIES.find((c) => c.id === focusedId) || CATEGORIES[0];
  const focusedIndex = CATEGORIES.findIndex((c) => c.id === focusedId);
  const nextCategory =
    CATEGORIES[(focusedIndex + 1) % CATEGORIES.length];

  useEffect(() => {
    if (
      starredCount !== prevStarredRef.current &&
      prevStarredRef.current !== 0
    ) {
      setCounterPulse(true);
      setTimeout(() => setCounterPulse(false), 600);
    }
    prevStarredRef.current = starredCount;
  }, [starredCount]);

  // Switching rail category closes any open chat instead of leaving it
  // pinned to a category that's no longer in focus, resets the focus pane's
  // internal scroll to the top, and moves keyboard focus to the new focus
  // panel heading (skipped on first mount so initial page load doesn't grab
  // focus).
  useEffect(() => {
    setActiveCategory(null);
    setChatExpanded(false);
    if (prevFocusedIdRef.current !== focusedId) {
      focusPaneRef.current?.scrollTo(0, 0);
      headingRef.current?.focus({ preventScroll: true });
    }
    prevFocusedIdRef.current = focusedId;
  }, [focusedId]);

  return (
    <FlashProvider>
      <div className="canvas-layout">
        <div className="canvas-rules" ref={scrollRef}>
          <div className="canvas-inner canvas-inner-board">
            <h2 className="board-title">AI Use Cases</h2>
            <p className="board-coach">
              Star every idea that resonates. The more you star, the richer
              your change strategy.
            </p>

            <div className="board3">
              <BoardRail
                label="Six categories"
                items={CATEGORIES.map((c) => ({
                  id: c.id,
                  number: c.number,
                  title: c.title,
                  count: (state.primitives[c.id] || []).length,
                  starredCount: (state.primitives[c.id] || []).filter(
                    (i) => i.starred,
                  ).length,
                }))}
                activeId={focusedId}
                onSelect={setFocusedId}
                note={`12 ideas total. Visit every category; star at least ${MIN_STARS_FOR_PLAYBOOK} to continue.`}
              />

              <section className="board-focus" ref={focusPaneRef}>
                <CategorySection
                  category={focusedCategory}
                  ideas={state.primitives[focusedId] || []}
                  dispatch={dispatch}
                  onGoDeeper={setActiveCategory}
                  focusIndex={focusedIndex}
                  total={CATEGORIES.length}
                  onNext={() => setFocusedId(nextCategory.id)}
                  nextTitle={nextCategory.title}
                  headingRef={headingRef}
                />

                {activeCategory && activeCategory.id === focusedId && (
                  <div
                    className={`chat-inline${chatExpanded ? " chat-expanded" : ""}`}
                  >
                    <ChatDrawer
                      key={activeCategory.id}
                      type="primitive"
                      item={activeCategory}
                      state={state}
                      dispatch={dispatch}
                      onClose={() => {
                        setActiveCategory(null);
                        setChatExpanded(false);
                      }}
                      expanded={chatExpanded}
                      onToggleExpand={() => setChatExpanded((v) => !v)}
                    />
                  </div>
                )}
              </section>

              <CommitmentTray
                title="Your starred ideas"
                countLabel={`${starredCount} of ${totalIdeas}`}
                groups={[
                  {
                    items: allStarred.map((s) => ({
                      id: s.id,
                      text: s.text,
                      sourceLabel: s.categoryTitle,
                    })),
                  },
                ]}
                status={
                  <p className="tray-status">
                    <b>{starredCount} starred</b> ·{" "}
                    {canContinue
                      ? "strategy unlocked."
                      : `strategy unlocks at ${MIN_STARS_FOR_PLAYBOOK}.`}
                  </p>
                }
                emptyText="Star ideas and they collect here."
              />
            </div>
          </div>

          {/* Gate - direct child of canvas-rules for sticky to work */}
          <GateBar
            left={
              <span className={counterPulse ? "counter-pulse" : ""}>
                <Star
                  size={14}
                  fill={C.star}
                  color={C.star}
                  style={{ verticalAlign: "text-bottom" }}
                />{" "}
                <strong>{starredCount}</strong> starred
              </span>
            }
            hint={
              starredCount === 0
                ? "Star the ideas that matter to you"
                : !canContinue
                  ? `Star at least ${MIN_STARS_FOR_PLAYBOOK} to continue`
                  : "Ready when you are"
            }
          >
            <button
              onClick={() => exportPrimitivesDocx(state)}
              className="btn-pill-ghost"
            >
              <Download size={14} /> Export
            </button>
            <button onClick={onStartOver} className="btn-pill-ghost">
              <RotateCcw size={12} /> Start over
            </button>
            <button
              onClick={canContinue ? onContinue : undefined}
              className="btn-pill"
              disabled={!canContinue}
            >
              Continue to strategy <ChevronRight size={16} />
            </button>
          </GateBar>
        </div>
      </div>
    </FlashProvider>
  );
}
