import { useState, useEffect, useRef } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { C } from "../../config/constants";
import { useFlash } from "../../context/AppContext";
import IdeaCard from "./IdeaCard";
import AddIdeaInput from "./AddIdeaInput";

export default function CategorySection({
  category,
  ideas,
  dispatch,
  onGoDeeper,
  focusIndex,
  total,
  onNext,
  nextTitle,
}) {
  const { flash } = useFlash();
  const isFlashing = flash === category.id;
  const hasIdeas = ideas.length > 0;
  const [newIds, setNewIds] = useState(new Set());
  const prevCountRef = useRef(ideas.length);

  useEffect(() => {
    if (ideas.length > prevCountRef.current) {
      const newOnes = ideas.slice(prevCountRef.current);
      const ids = new Set(newOnes.map((a) => a.id));
      setNewIds(ids);
      setTimeout(() => setNewIds(new Set()), 600);
    }
    prevCountRef.current = ideas.length;
  }, [ideas]);

  return (
    <div
      className={isFlashing ? "rule-flashing" : ""}
      id={`category-${category.id}`}
      data-category-id={category.id}
    >
      <div className="focus-head">
        <span className="focus-kicker">
          Category {String(focusIndex + 1).padStart(2, "0")} of{" "}
          {String(total).padStart(2, "0")}
        </span>
        <h2>{category.title}</h2>
        <p className="focus-sub">{category.description}</p>
        <p className="focus-desc">{category.principle}</p>
      </div>

      {hasIdeas ? (
        <div className="rule-actions">
          {ideas.map((idea, i) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              categoryId={category.id}
              dispatch={dispatch}
              isNew={newIds.has(idea.id)}
              index={i}
            />
          ))}
        </div>
      ) : (
        <div className="use-card-empty">
          <Sparkles
            size={22}
            color={category.color || C.accent}
            style={{ opacity: 0.5, marginBottom: 10 }}
          />
          <p className="use-card-empty-title">No ideas yet</p>
          <p className="use-card-empty-hint">{category.emptyNudge}</p>
        </div>
      )}

      <div className="rule-footer">
        <div className="rule-footer-add">
          <AddIdeaInput categoryId={category.id} dispatch={dispatch} />
        </div>
        <button
          onClick={() => onGoDeeper(category)}
          className="btn-go-deeper"
        >
          <MessageCircle size={14} /> Brainstorm with AI
        </button>
      </div>

      <div className="focus-foot">
        <button className="btn-pill-ghost" onClick={onNext}>
          Next category: {nextTitle} →
        </button>
      </div>
    </div>
  );
}
