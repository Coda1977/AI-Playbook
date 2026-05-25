import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { CATEGORIES } from "../config/categories";
import { RULES } from "../config/rules";

export async function exportPrimitivesDocx(state) {
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

export async function exportPlaybookDocx(state) {
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

export async function exportSynthesisDocx(state) {
  const { synthesis, intake } = state;
  if (!synthesis) return;

  const date = new Date(synthesis.generatedAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const narrativeText = synthesis.narrative || synthesis.lede || "";

  const children = [
    new Paragraph({ text: synthesis.title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [new TextRun({ text: `${intake.role} · ${date}`, italics: true, size: 22 })],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: narrativeText, italics: true, size: 24 })],
      spacing: { after: 400 },
    }),
  ];

  if ((synthesis.thisWeek || []).length > 0) {
    children.push(new Paragraph({
      text: "This Week",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 500, after: 200 },
    }));
    synthesis.thisWeek.forEach((item, i) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${String(i + 1).padStart(2, "0")}. `, bold: true }),
          new TextRun({ text: item }),
        ],
        spacing: { after: 120 },
      }));
    });
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "ai-one-page-plan.docx");
}
