import { useState, useEffect, useRef } from "react";
import { Check, Sparkles, MessageCircle } from "lucide-react";
import { C } from "../../config/constants";
import { useFlash } from "../../context/AppContext";
import ActionCard from "./ActionCard";
import AddActionInput from "./AddActionInput";

export default function RuleSection({ rule, actions, dispatch, isActive, onGoDeeper, delay, isLast }) {
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
      className={`rule-section ${isActive ? "rule-active" : ""} ${isFlashing ? "rule-flashing" : ""}`}
      style={{ animationDelay: `${delay}s`, "--rule-color": rule.color || C.accent }}
      id={`rule-${rule.id}`}
    >
      <div className="rule-content">
        <div className="rule-header">
          <div className="rule-number-label" style={{ color: C.red }}>
            Rule {rule.number}
            {hasActions && (
              <span className="rule-check" style={{ background: `${rule.color || C.accent}18`, color: rule.color || C.accent }}>
                <Check size={12} />
              </span>
            )}
          </div>
        </div>
        <h2 className="rule-name">{rule.name}</h2>
        <div className="rule-principle">
          <p>{rule.principle}</p>
        </div>

        {hasActions ? (
          <div className="rule-actions">
            {actions.map((a) => (
              <ActionCard key={a.id} action={a} ruleId={rule.id} dispatch={dispatch} isNew={newActionIds.has(a.id)} />
            ))}
          </div>
        ) : (
          <div className="rule-empty">
            <Sparkles size={22} color={rule.color || C.accent} style={{ opacity: 0.5, marginBottom: 10 }} />
            <p className="rule-empty-title">No actions yet</p>
            <p className="rule-empty-hint">{rule.emptyNudge}</p>
          </div>
        )}

        <div className="rule-footer">
          <div className="rule-footer-add">
            <AddActionInput ruleId={rule.id} dispatch={dispatch} />
          </div>
          <button onClick={() => onGoDeeper(rule)} className="btn-go-deeper" >
            <MessageCircle size={14} /> Go Deeper with AI
          </button>
        </div>
      </div>
    </div>
  );
}
