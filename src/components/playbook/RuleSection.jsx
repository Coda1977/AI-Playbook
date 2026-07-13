import { useState, useEffect, useRef } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { C } from "../../config/constants";
import { useFlash } from "../../context/AppContext";
import ActionCard from "./ActionCard";
import AddActionInput from "./AddActionInput";

export default function RuleSection({
  rule,
  actions,
  dispatch,
  onGoDeeper,
  focusIndex,
  total,
  onNext,
  nextName,
  headingRef,
}) {
  const { flash } = useFlash();
  const isFlashing = flash === rule.id;
  const hasActions = actions.length > 0;
  const [newActionIds, setNewActionIds] = useState(new Set());
  const prevCountRef = useRef(actions.length);

  useEffect(() => {
    if (actions.length > prevCountRef.current) {
      const newOnes = actions.slice(prevCountRef.current);
      const ids = new Set(newOnes.map((a) => a.id));
      setNewActionIds(ids);
      setTimeout(() => setNewActionIds(new Set()), 600);
    }
    prevCountRef.current = actions.length;
  }, [actions]);

  return (
    <div
      className={isFlashing ? "rule-flashing" : ""}
      id={`rule-${rule.id}`}
      data-rule-id={rule.id}
    >
      <div className="focus-head">
        <span className="focus-kicker">
          Rule {String(focusIndex + 1).padStart(2, "0")} of{" "}
          {String(total).padStart(2, "0")}
        </span>
        <h2 ref={headingRef} tabIndex={-1}>{rule.name}</h2>
        <div className="rule-science">
          <p>{rule.principle}</p>
        </div>
      </div>

      {hasActions ? (
        <div className="rule-actions">
          {actions.map((a, i) => (
            <ActionCard
              key={a.id}
              action={a}
              ruleId={rule.id}
              dispatch={dispatch}
              isNew={newActionIds.has(a.id)}
              index={i}
            />
          ))}
        </div>
      ) : (
        <div className="use-card-empty">
          <Sparkles
            size={22}
            color={C.accent}
            style={{ opacity: 0.5, marginBottom: 10 }}
          />
          <p className="use-card-empty-title">No actions yet</p>
          <p className="use-card-empty-hint">{rule.emptyNudge}</p>
        </div>
      )}

      <div className="rule-footer">
        <div className="rule-footer-add">
          <AddActionInput key={rule.id} ruleId={rule.id} dispatch={dispatch} />
        </div>
        <button onClick={() => onGoDeeper(rule)} className="btn-go-deeper">
          <MessageCircle size={14} /> Go Deeper with AI
        </button>
      </div>

      <div className="focus-foot">
        <button className="btn-pill-ghost" onClick={onNext}>
          Next rule: {nextName} →
        </button>
      </div>
    </div>
  );
}
