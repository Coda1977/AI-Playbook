import { useState } from "react";
import { RotateCcw, ChevronRight, ArrowLeft, Download } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import ConfirmModal from "./ConfirmModal";
import PhaseProgress from "./PhaseProgress";
import { clearState } from "../../utils/storage";
import { CATEGORIES } from "../../config/categories";
import { RULES } from "../../config/rules";

function truncateRole(role, maxLen = 50) {
  if (!role || role.length <= maxLen) return role;
  const trimmed = role.slice(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(" ");
  return lastSpace > 20 ? trimmed.slice(0, lastSpace) + "..." : trimmed + "...";
}

async function exportPrimitivesDocx(state) {
  const { primitives, intake } = state;
  const children = [
    new Paragraph({ text: "My AI Use Cases", heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: intake.role, bold: true, size: 28 })], spacing: { after: 400 } }),
  ];

  const starred = CATEGORIES.flatMap((c) =>
    (primitives[c.id] || []).filter((n) => n.starred).map((n) => ({ ...n, category: c.title }))
  );
  if (starred.length > 0) {
    children.push(new Paragraph({ text: "Priority Ideas", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }));
    starred.forEach((n) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${n.category}: `, bold: true }), new TextRun({ text: n.text })], bullet: { level: 0 } }));
    });
  }

  CATEGORIES.forEach((c) => {
    const ideas = primitives[c.id] || [];
    if (ideas.length === 0) return;
    children.push(new Paragraph({ text: c.title, heading: HeadingLevel.HEADING_2, spacing: { before: 300 } }));
    ideas.forEach((n) => {
      children.push(new Paragraph({ children: [new TextRun({ text: n.starred ? "* " : "", bold: true }), new TextRun({ text: n.text })], bullet: { level: 0 } }));
    });
  });

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "ai-use-cases.docx");
}

async function exportPlaybookDocx(state) {
  const { plan, intake } = state;
  const children = [
    new Paragraph({ text: "My AI Change Playbook", heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: intake.role, bold: true, size: 28 })], spacing: { after: 400 } }),
  ];

  const starred = RULES.flatMap((r) =>
    (plan[r.id] || []).filter((a) => a.starred).map((a) => ({ ...a, rule: r.name, ruleNumber: r.number }))
  );
  if (starred.length > 0) {
    children.push(new Paragraph({ text: "Priority Actions", heading: HeadingLevel.HEADING_1, spacing: { before: 400 } }));
    starred.forEach((a) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `Rule ${a.ruleNumber}: `, bold: true }), new TextRun({ text: a.text })], bullet: { level: 0 } }));
    });
  }

  RULES.forEach((r) => {
    const actions = plan[r.id] || [];
    if (actions.length === 0) return;
    children.push(new Paragraph({ text: `Rule ${r.number}: ${r.name}`, heading: HeadingLevel.HEADING_2, spacing: { before: 300 } }));
    actions.forEach((a) => {
      children.push(new Paragraph({ children: [new TextRun({ text: a.starred ? "* " : "", bold: true }), new TextRun({ text: a.text })], bullet: { level: 0 } }));
    });
  });

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "ai-change-playbook.docx");
}

export default function Header({ state, dispatch }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { phase, intake } = state;
  const showRole = intake.role && phase !== "intake" && phase !== "generating-primitives" && phase !== "generating-playbook";

  return (
    <>
      <header className="header no-print">
        <div className="header-inner">
          <div className="header-left">
            <span className="header-title">AI Playbook</span>
            {showRole && (
              <>
                <span className="header-divider">|</span>
                <span className="header-role" title={intake.role}>{truncateRole(intake.role)}</span>
              </>
            )}
          </div>
          <div className="header-actions">
            {phase !== "intake" && phase !== "generating-primitives" && phase !== "generating-playbook" && (
              <PhaseProgress phase={phase} dispatch={dispatch} />
            )}
            {phase === "primitives" && (
              <>
                <button onClick={() => exportPrimitivesDocx(state)} className="btn-ghost">
                  <Download size={14} /> Export Ideas (.docx)
                </button>
                <button onClick={() => setShowConfirm(true)} className="btn-ghost">
                  <RotateCcw size={14} /> Start Over
                </button>
              </>
            )}
            {phase === "playbook" && (
              <>
                <button onClick={() => exportPlaybookDocx(state)} className="btn-ghost">
                  <Download size={14} /> Export Strategy (.docx)
                </button>
                <button onClick={() => dispatch({ type: "SET_PHASE", phase: "commitment" })} className="btn-primary">
                  Review & Download <ChevronRight size={14} />
                </button>
                <button onClick={() => setShowConfirm(true)} className="btn-ghost">
                  <RotateCcw size={14} /> Start Over
                </button>
              </>
            )}
            {phase === "commitment" && (
              <button onClick={() => dispatch({ type: "SET_PHASE", phase: "playbook" })} className="btn-ghost">
                <ArrowLeft size={14} /> Back to Edit Strategy
              </button>
            )}
          </div>
        </div>
      </header>
      <ConfirmModal
        open={showConfirm}
        title="Start fresh?"
        message="This will clear everything -- all ideas, actions, stars, and conversations. You can't undo this."
        confirmLabel="Yes, start fresh"
        onConfirm={() => {
          setShowConfirm(false);
          clearState();
          dispatch({ type: "RESET" });
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
