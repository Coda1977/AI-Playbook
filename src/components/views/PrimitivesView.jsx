import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, Star, Download } from "lucide-react";
import { CATEGORIES } from "../../config/categories";
import { MIN_STARS_FOR_PLAYBOOK, C } from "../../config/constants";
import { FlashProvider } from "../../context/AppContext";
import { exportPrimitivesDocx } from "../../utils/export";
import CategorySection from "../primitives/CategorySection";
import ChatDrawer from "../shared/ChatDrawer";

export default function PrimitivesView({ state, dispatch, onContinue }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [counterPulse, setCounterPulse] = useState(false);
  const [activeCatId, setActiveCatId] = useState(null);
  const prevStarredRef = useRef(0);
  const scrollRef = useRef(null);
  const chatOpen = activeCategory !== null;

  const totalIdeas = CATEGORIES.reduce((sum, c) => sum + (state.primitives[c.id] || []).length, 0);
  const starredCount = CATEGORIES.reduce((sum, c) => sum + (state.primitives[c.id] || []).filter((i) => i.starred).length, 0);
  const categoriesWithIdeas = CATEGORIES.filter((c) => (state.primitives[c.id] || []).length > 0).length;
  const canContinue = starredCount >= MIN_STARS_FOR_PLAYBOOK;

  useEffect(() => {
    if (starredCount !== prevStarredRef.current && prevStarredRef.current !== 0) {
      setCounterPulse(true);
      setTimeout(() => setCounterPulse(false), 600);
    }
    prevStarredRef.current = starredCount;
  }, [starredCount]);

  // IntersectionObserver for sticky category nav
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const sections = container.querySelectorAll("[data-category-id]");
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCatId(entry.target.getAttribute("data-category-id"));
          }
        }
      },
      { root: container, rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [state.primitives]);

  const scrollToCategory = useCallback((catId) => {
    const container = scrollRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-category-id="${catId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <FlashProvider>
      <div className="canvas-layout">
        <div className="canvas-rules" ref={scrollRef}>
          <div className="canvas-inner">
            <div className="canvas-orientation animate-fade-in">
              <div className="orientation-stats">
                <span className="orientation-stat"><strong>{totalIdeas}</strong> ideas</span>
                <span className="orientation-dot">&middot;</span>
                <span className="orientation-stat"><strong>{categoriesWithIdeas}</strong> of 6 categories</span>
                {starredCount > 0 && (
                  <>
                    <span className="orientation-dot">&middot;</span>
                    <span className="orientation-stat">
                      <Star size={14} fill={C.accentGlow} color={C.accentGlow} style={{ verticalAlign: "text-bottom" }} />
                      {" "}<strong>{starredCount}</strong> starred
                    </span>
                  </>
                )}
              </div>
              <p className="orientation-hint">
                Star at least {MIN_STARS_FOR_PLAYBOOK} ideas that matter most -- these will shape your change strategy.
              </p>
            </div>

            <div className="category-nav">
              {CATEGORIES.filter((c) => (state.primitives[c.id] || []).length > 0).map((c) => (
                <button
                  key={c.id}
                  className={`category-nav-item ${activeCatId === c.id ? "active" : ""}`}
                  onClick={() => scrollToCategory(c.id)}
                >
                  {c.title}
                </button>
              ))}
            </div>

            <div className="card-stack">
              {CATEGORIES.map((c, i) => (
                <CategorySection
                  key={c.id}
                  category={c}
                  ideas={state.primitives[c.id] || []}
                  dispatch={dispatch}
                  isActive={activeCategory?.id === c.id}
                  onGoDeeper={setActiveCategory}
                  delay={i * 0.05}
                  isLast={i === CATEGORIES.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Gate -- direct child of canvas-rules for sticky to work */}
          <div className="gate-bar">
            <div className={`gate-counter ${counterPulse ? "counter-pulse" : ""}`}>
              {canContinue ? (
                <span><Star size={14} fill={C.accentGlow} color={C.accentGlow} style={{ verticalAlign: "text-bottom" }} /> <strong>{starredCount}</strong> starred -- ready to build your strategy</span>
              ) : starredCount === 0 ? (
                <span>Star ideas that matter most to you to continue</span>
              ) : (
                <span><strong>{starredCount}</strong> of {MIN_STARS_FOR_PLAYBOOK} starred -- star {MIN_STARS_FOR_PLAYBOOK - starredCount} more to continue</span>
              )}
            </div>
            <div className="gate-actions">
              <button onClick={() => exportPrimitivesDocx(state)} className="btn-ghost btn-sm gate-export-btn">
                <Download size={14} /> Export
              </button>
              <button
                onClick={canContinue ? onContinue : undefined}
                className={`btn-gate ${canContinue ? "btn-gate-active" : "btn-gate-disabled"}`}
                disabled={!canContinue}
              >
                Continue to Change Strategy <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {chatOpen && (
          <>
            <div onClick={() => setActiveCategory(null)} className="chat-backdrop" />
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
