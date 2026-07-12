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
  const [counterPulse, setCounterPulse] = useState(false);
  const prevStarredRef = useRef(0);
  const scrollRef = useRef(null);
  const chatOpen = activeCategory !== null;

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
                note="12 ideas total. Visit every category; star freely."
              />

              <section className="board-focus">
                <CategorySection
                  category={focusedCategory}
                  ideas={state.primitives[focusedId] || []}
                  dispatch={dispatch}
                  onGoDeeper={setActiveCategory}
                  focusIndex={focusedIndex}
                  total={CATEGORIES.length}
                  onNext={() => setFocusedId(nextCategory.id)}
                  nextTitle={nextCategory.title}
                />
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
                    <b>{starredCount} starred</b> · every star enriches the
                    plan.
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
                <strong>{starredCount}</strong> of {totalIdeas} starred
                {starredCount >= MIN_STARS_FOR_PLAYBOOK
                  ? " · strategy unlocked"
                  : ` · star at least ${MIN_STARS_FOR_PLAYBOOK} to unlock strategy`}
              </span>
            }
            hint="Ready when you are"
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
              Continue to Strategy <ChevronRight size={16} />
            </button>
          </GateBar>
        </div>

        {chatOpen && (
          <>
            <div
              onClick={() => setActiveCategory(null)}
              className="chat-backdrop"
            />
            <div className="chat-panel">
              <ChatDrawer
                key={activeCategory.id}
                type="primitive"
                item={activeCategory}
                state={state}
                dispatch={dispatch}
                onClose={() => setActiveCategory(null)}
              />
            </div>
          </>
        )}
      </div>
    </FlashProvider>
  );
}
