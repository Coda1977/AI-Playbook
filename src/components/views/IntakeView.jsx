import { useState, useRef } from "react";
import { Sparkles, CheckCircle2, Circle } from "lucide-react";
import { HELP_OPTIONS } from "../../config/categories";
import { FLUENCY_OPTIONS } from "../../config/rules";
import { C } from "../../config/constants";

function TextareaWithGuide({ value, onChange, placeholder, rows = 3, hasError }) {
  const len = value.trim().length;
  const hint = len === 0 ? null : len < 30 ? "A bit more detail will help AI personalize your plan." : len < 80 ? "Good start -- the more specific, the better." : "Great detail -- this will help create a strong plan.";
  const hintColor = len < 30 ? "#b45309" : "#059669";
  return (
    <div>
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className={`input-textarea ${hasError ? "input-error" : ""}`} />
      {hint && <p className="input-hint" style={{ color: hintColor }}>{hint}</p>}
    </div>
  );
}

function FluencySelector({ value, onChange, type, hasError }) {
  return (
    <div className={`fluency-grid ${hasError ? "fluency-grid-error" : ""}`}>
      {FLUENCY_OPTIONS.map((o) => {
        const d = type === "manager" ? o.managerDesc : o.teamDesc;
        const v = `${o.label} -- ${d}`;
        const sel = value === v;
        return (
          <button key={o.level} onClick={() => onChange(v)} type="button"
            className={`fluency-option ${sel ? "fluency-selected" : ""}`}>
            <div className="fluency-check">
              {sel ? <CheckCircle2 size={18} color={C.gray900} /> : <Circle size={18} color={C.gray200} />}
            </div>
            <div>
              <div className="fluency-label">{o.label}</div>
              <div className="fluency-desc">{d}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function HelpMultiSelect({ selected, onToggle, hasError }) {
  return (
    <div className={`fluency-grid ${hasError ? "fluency-grid-error" : ""}`}>
      {HELP_OPTIONS.map((o) => {
        const sel = selected.includes(o.id);
        return (
          <button key={o.id} onClick={() => onToggle(o.id)} type="button"
            className={`help-option ${sel ? "help-option-selected" : ""}`}>
            <div className="fluency-check">
              {sel ? <CheckCircle2 size={18} color={C.gray900} /> : <Circle size={18} color={C.gray200} />}
            </div>
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function IntakeView({ state, dispatch, onGenerate }) {
  const existing = state.intake;
  const [f, setF] = useState(
    existing.role
      ? existing
      : { role: "", helpWith: [], responsibilities: "", managerFluency: "", teamFluency: "", failureRisks: "", successVision: "" }
  );
  const [attempted, setAttempted] = useState(false);
  const formRef = useRef(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleHelp = (id) => setF((p) => ({ ...p, helpWith: p.helpWith.includes(id) ? p.helpWith.filter((h) => h !== id) : [...p.helpWith, id] }));

  const ok = f.role && f.helpWith.length > 0 && f.responsibilities && f.managerFluency && f.teamFluency && f.failureRisks && f.successVision;

  const missing = (field) => attempted && !f[field];
  const missingArray = (field) => attempted && (!f[field] || f[field].length === 0);

  const handleSubmit = () => {
    if (ok) {
      dispatch({ type: "SET_INTAKE", intake: f });
      onGenerate(f);
    } else {
      setAttempted(true);
      const first = formRef.current?.querySelector(".input-error, .fluency-grid-error");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="intake-container" ref={formRef}>
      <div className="animate-fade-in">
        <div className="intake-label">Workshop Tool</div>
        <h1 className="intake-title">Map Your AI Potential & Build Your Change Strategy</h1>
        <p className="intake-subtitle">Answer seven questions about your role and team. AI will discover use cases tailored to you, then build a personalized change strategy grounded in behavioral science.</p>
        <p className="intake-step">Step 1 of 4</p>
      </div>

      {attempted && !ok && (
        <div className="intake-validation-msg animate-fade-in">Please complete all fields before continuing.</div>
      )}

      <div className="intake-fields">
        {/* 1. Role */}
        <div className="animate-fade-in" style={{ animationDelay: "0.06s" }}>
          <label className="field-label">Your role and team</label>
          <p className="field-desc">What's your role, and what does your team do day-to-day?</p>
          <TextareaWithGuide value={f.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g., VP of Customer Success leading a 12-person team across onboarding, support, and renewals" hasError={missing("role")} />
        </div>

        {/* 2. Help With */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <label className="field-label">What would help you most?</label>
          <p className="field-desc">Select all that apply -- these shape the AI use cases we'll discover.</p>
          <HelpMultiSelect selected={f.helpWith} onToggle={toggleHelp} hasError={missingArray("helpWith")} />
        </div>

        {/* 3. Responsibilities */}
        <div className="animate-fade-in" style={{ animationDelay: "0.14s" }}>
          <label className="field-label">Your main responsibilities</label>
          <p className="field-desc">What do you spend most of your time on?</p>
          <TextareaWithGuide value={f.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} placeholder="e.g., Campaign planning, team coordination, stakeholder reporting, client QBRs" hasError={missing("responsibilities")} />
        </div>

        {/* 4. Manager Fluency */}
        <div className="animate-fade-in" style={{ animationDelay: "0.18s" }}>
          <label className="field-label">Your own AI fluency</label>
          <p className="field-desc">How would you describe your own AI usage right now?</p>
          <FluencySelector value={f.managerFluency} onChange={(v) => set("managerFluency", v)} type="manager" hasError={missing("managerFluency")} />
        </div>

        {/* 5. Team Fluency */}
        <div className="animate-fade-in" style={{ animationDelay: "0.22s" }}>
          <label className="field-label">Your team's AI fluency</label>
          <p className="field-desc">How would you describe your team's AI usage overall?</p>
          <FluencySelector value={f.teamFluency} onChange={(v) => set("teamFluency", v)} type="team" hasError={missing("teamFluency")} />
        </div>

        {/* 6. Failure Risks */}
        <div className="animate-fade-in" style={{ animationDelay: "0.26s" }}>
          <label className="field-label">What would make AI adoption fail on your team?</label>
          <p className="field-desc">If AI adoption stalls or fails on your team, what are the most likely reasons?</p>
          <TextareaWithGuide value={f.failureRisks} onChange={(e) => set("failureRisks", e.target.value)} placeholder="e.g., My two senior architects think AI-generated work is beneath them, and the rest of the team follows their lead" hasError={missing("failureRisks")} />
        </div>

        {/* 7. Success Vision */}
        <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <label className="field-label">What does success look like in 90 days?</label>
          <p className="field-desc">If everything goes well, what does your team's AI usage look like 3 months from now?</p>
          <TextareaWithGuide value={f.successVision} onChange={(e) => set("successVision", e.target.value)} placeholder="e.g., Every CSM uses AI to prep for client calls, and we've cut QBR prep time in half" hasError={missing("successVision")} />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className={`btn-generate ${attempted && !ok ? "btn-shake" : ""}`}
          style={{ animationDelay: "0.34s" }}
        >
          <Sparkles size={16} /> Discover My AI Use Cases
        </button>
      </div>
    </div>
  );
}
