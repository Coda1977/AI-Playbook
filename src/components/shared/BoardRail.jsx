// src/components/shared/BoardRail.jsx
export default function BoardRail({ label, items, activeId, onSelect, note }) {
  return (
    <aside className="rail no-print">
      <span className="rail-label">{label}</span>
      {items.map((it) => (
        <button
          key={it.id}
          className={`rail-item${it.id === activeId ? " rail-active" : ""}`}
          onClick={() => onSelect(it.id)}
        >
          <span className="rail-idx">{String(it.number).padStart(2, "0")}</span>
          <span className="rail-name">{it.title}</span>
          {it.starredCount > 0
            ? <span className="rail-st">★{it.starredCount}</span>
            : <span className="rail-cnt">{it.count}</span>}
        </button>
      ))}
      {note && <div className="rail-note">{note}</div>}
    </aside>
  );
}
