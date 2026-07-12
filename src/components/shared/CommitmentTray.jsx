// src/components/shared/CommitmentTray.jsx
import { Star } from "lucide-react";
export default function CommitmentTray({ title, countLabel, groups, status, emptyText }) {
  const empty = groups.every((g) => g.items.length === 0);
  return (
    <aside className="tray no-print">
      <div className="tray-head">
        <span className="tray-star-chip"><Star size={13} fill="currentColor" /></span>
        <b>{title}</b>
        <span className="tray-count">{countLabel}</span>
      </div>
      <div className="tray-body">
        {empty && <p className="tray-empty">{emptyText}</p>}
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.label && <div className="tray-group">{g.label}</div>}
            {g.items.map((it) => (
              <div key={it.id} className="tray-item">
                <span className="tray-item-star">★</span>
                <span>{it.text}<small>{it.sourceLabel}</small></span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {status && <div className="tray-foot">{status}</div>}
    </aside>
  );
}
