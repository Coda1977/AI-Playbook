import { useState, useEffect, useRef } from "react";
import { Star, Pencil, Trash2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useApp } from "../../context/AppContext";

export default function IdeaCard({ idea, categoryId, dispatch, isNew, index }) {
  const { showToast } = useToast();
  const { state } = useApp();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(idea.text);
  const [blooming, setBlooming] = useState(false);
  const [popping, setPopping] = useState(false);
  const ref = useRef(null);

  useEffect(() => { setText(idea.text); }, [idea.text]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const save = () => {
    if (text.trim()) dispatch({ type: "UPDATE_PRIMITIVE", categoryId, ideaId: idea.id, text: text.trim() });
    setEditing(false);
  };
  const handleDelete = () => {
    // Captured before the delete so an Undo can hand contentVersion back and
    // leave the Big Move's freshness untouched (see AppContext's reducer).
    const prevContentVersion = state.contentVersion || 0;
    dispatch({ type: "DELETE_PRIMITIVE", categoryId, ideaId: idea.id });
    showToast("Idea deleted", {
      actionLabel: "Undo",
      duration: 6000,
      onAction: () =>
        dispatch({
          type: "RESTORE_ITEM",
          kind: "primitive",
          containerId: categoryId,
          item: idea,
          index,
          prevContentVersion,
        }),
    });
  };
  const handleStar = () => {
    setBlooming(true);
    setPopping(true);
    dispatch({ type: "TOGGLE_PRIMITIVE_STAR", categoryId, ideaId: idea.id });
    if (!idea.starred) {
      showToast("Added to your priorities");
    }
    setTimeout(() => setBlooming(false), 500);
    setTimeout(() => setPopping(false), 500);
  };

  const isStarred = idea.starred;

  return (
    <div className={`action-card ${isStarred ? "action-starred" : ""} ${blooming ? "action-blooming" : ""} ${isNew ? "action-entering" : ""}`}>
      <button onClick={handleStar} className={`star-btn ${popping ? "star-popping" : ""}`} aria-label={isStarred ? "Unstar" : "Star"}>
        <Star size={18} fill={isStarred ? "currentColor" : "none"} />
      </button>
      <div className="action-text-area">
        {editing ? (
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); }
              if (e.key === "Escape") { setText(idea.text); setEditing(false); }
            }}
            onBlur={save}
            rows={2}
            className="action-edit-input"
          />
        ) : (
          <p className="action-text">{idea.text}</p>
        )}
      </div>
      {!editing && (
        <div className="action-inline-actions">
          <button onClick={() => setEditing(true)} className="action-inline-btn" aria-label="Edit">
            <Pencil size={16} />
          </button>
          <button onClick={handleDelete} className="action-inline-btn action-inline-delete" aria-label="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
