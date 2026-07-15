import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { CATEGORIES } from "../config/categories";
import { RULES } from "../config/rules";

const FONT = "Hanken Grotesk";
const COLOR_INK = "1C1C1E";
const COLOR_KICKER = "A8513F";
const COLOR_STAR = "2F669D";

// Document-level default so every run inherits the brand font/ink without
// repeating `font`/`color` on each TextRun.
const DOCX_STYLES = {
  default: {
    document: {
      run: { font: FONT, color: COLOR_INK },
    },
  },
};

function heading(text, level, spacing) {
  return new Paragraph({
    children: [new TextRun({ text, color: COLOR_INK })],
    heading: level,
    ...(spacing ? { spacing } : {}),
  });
}

export async function exportPrimitivesDocx(state) {
  const { primitives, intake } = state;
  const children = [
    heading("My AI Use Cases", HeadingLevel.TITLE),
    new Paragraph({ children: [new TextRun({ text: intake.role, bold: true, size: 28 })], spacing: { after: 400 } }),
  ];

  const starred = CATEGORIES.flatMap((c) =>
    (primitives[c.id] || []).filter((n) => n.starred).map((n) => ({ ...n, category: c.title }))
  );
  if (starred.length > 0) {
    children.push(heading("Priority Ideas", HeadingLevel.HEADING_1, { before: 400 }));
    starred.forEach((n) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "★ ", bold: true, color: COLOR_STAR }),
          new TextRun({ text: `${n.category}: `, bold: true, color: COLOR_KICKER }),
          new TextRun({ text: n.text }),
        ],
        bullet: { level: 0 },
      }));
    });
  }

  CATEGORIES.forEach((c) => {
    const ideas = primitives[c.id] || [];
    if (ideas.length === 0) return;
    children.push(heading(c.title, HeadingLevel.HEADING_2, { before: 300 }));
    ideas.forEach((n) => {
      children.push(new Paragraph({
        children: [
          ...(n.starred ? [new TextRun({ text: "★ ", bold: true, color: COLOR_STAR })] : []),
          new TextRun({ text: n.text }),
        ],
        bullet: { level: 0 },
      }));
    });
  });

  const doc = new Document({ styles: DOCX_STYLES, sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "ai-use-cases.docx");
}

export async function exportPlaybookDocx(state) {
  const { plan, intake } = state;
  const children = [
    heading("My AI Change Playbook", HeadingLevel.TITLE),
    new Paragraph({ children: [new TextRun({ text: intake.role, bold: true, size: 28 })], spacing: { after: 400 } }),
  ];

  const starred = RULES.flatMap((r) =>
    (plan[r.id] || []).filter((a) => a.starred).map((a) => ({ ...a, rule: r.name, ruleNumber: r.number }))
  );
  if (starred.length > 0) {
    children.push(heading("Priority Actions", HeadingLevel.HEADING_1, { before: 400 }));
    starred.forEach((a) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "★ ", bold: true, color: COLOR_STAR }),
          new TextRun({ text: `Rule ${a.ruleNumber}: `, bold: true, color: COLOR_KICKER }),
          new TextRun({ text: a.text }),
        ],
        bullet: { level: 0 },
      }));
    });
  }

  RULES.forEach((r) => {
    const actions = plan[r.id] || [];
    if (actions.length === 0) return;
    children.push(heading(`Rule ${r.number}: ${r.name}`, HeadingLevel.HEADING_2, { before: 300 }));
    actions.forEach((a) => {
      children.push(new Paragraph({
        children: [
          ...(a.starred ? [new TextRun({ text: "★ ", bold: true, color: COLOR_STAR })] : []),
          new TextRun({ text: a.text }),
        ],
        bullet: { level: 0 },
      }));
    });
  });

  const doc = new Document({ styles: DOCX_STYLES, sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "ai-change-playbook.docx");
}

export async function exportSynthesisDocx(state) {
  const { synthesis, intake } = state;
  if (!synthesis) return;

  const date = new Date(synthesis.generatedAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const title = synthesis.bigMoveTitle || synthesis.title || "";
  const actions = synthesis.actions || synthesis.thisWeek || [];

  const children = [
    heading("Your Big Move", HeadingLevel.TITLE),
    new Paragraph({
      children: [new TextRun({ text: `${intake.role} · ${date}`, italics: true, size: 22 })],
      spacing: { after: 200 },
    }),
    heading(title, HeadingLevel.HEADING_1, { after: 400 }),
  ];

  actions.forEach((item, i) => {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: `${String(i + 1).padStart(2, "0")}. `, bold: true }),
        new TextRun({ text: item }),
      ],
      spacing: { after: 120 },
    }));
  });

  const doc = new Document({ styles: DOCX_STYLES, sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "ai-big-move.docx");
}
