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
              {sel ? <CheckCircle2 size={18} color={C.black} /> : <Circle size={18} color={C.lightGray} />}
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

function HelpPills({ selected, onToggle, hasError }) {
  return (
    <div className={`pill-group ${hasError ? "fluency-grid-error" : ""}`}>
      {HELP_OPTIONS.map((o) => {
        const sel = selected.includes(o.id);
        return (
          <button key={o.id} onClick={() => onToggle(o.id)} type="button"
            className={`pill ${sel ? "on" : ""}`}>
            {o.label}
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
      <div className="intake-split">
        <div className="intake-main">
          {/* Hero panel -- dark */}
          <div className="intake-hero animate-fade-in">
            <div className="intake-label" style={{ color: "rgba(255,255,255,0.6)" }}>Personalized AI Playbook</div>
            <h1 className="intake-title" style={{ color: C.white }}>Map Your AI Potential & Build Your Change Strategy</h1>
            <p className="intake-subtitle" style={{ color: "rgba(255,255,255,0.65)" }}>Answer seven questions about your role and team. AI will discover use cases tailored to you, then build a personalized change strategy grounded in behavioral science.</p>
            <p className="intake-step" style={{ color: "rgba(255,255,255,0.4)" }}>Step 1 of 4</p>
          </div>

          {attempted && !ok && (
            <div className="intake-validation-msg animate-fade-in">Please complete all fields before continuing.</div>
          )}

          <div className="intake-fields">
            {/* 1. Role */}
            <article className="panel animate-fade-in" style={{ animationDelay: "0.06s" }}>
              <label className="field-label">Your role and team</label>
              <p className="field-desc">What's your role, and what does your team do day-to-day?</p>
              <TextareaWithGuide value={f.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g., VP of Customer Success leading a 12-person team across onboarding, support, and renewals" hasError={missing("role")} />
            </article>

            {/* 2. Help With -- Pill buttons */}
            <article className="panel animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <label className="field-label">What would help you most?</label>
              <p className="field-desc">Select all that apply -- these shape the AI use cases we'll discover.</p>
              <HelpPills selected={f.helpWith} onToggle={toggleHelp} hasError={missingArray("helpWith")} />
            </article>

            {/* 3. Responsibilities */}
            <article className="panel animate-fade-in" style={{ animationDelay: "0.14s" }}>
              <label className="field-label">Your main responsibilities</label>
              <p className="field-desc">What do you spend most of your time on?</p>
              <TextareaWithGuide value={f.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} placeholder="e.g., Campaign planning, team coordination, stakeholder reporting, client QBRs" hasError={missing("responsibilities")} />
            </article>

            {/* 4. Manager Fluency */}
            <article className="panel animate-fade-in" style={{ animationDelay: "0.18s" }}>
              <label className="field-label">Your own AI fluency</label>
              <p className="field-desc">How would you describe your own AI usage right now?</p>
              <FluencySelector value={f.managerFluency} onChange={(v) => set("managerFluency", v)} type="manager" hasError={missing("managerFluency")} />
            </article>

            {/* 5. Team Fluency */}
            <article className="panel animate-fade-in" style={{ animationDelay: "0.22s" }}>
              <label className="field-label">Your team's AI fluency</label>
              <p className="field-desc">How would you describe your team's AI usage overall?</p>
              <FluencySelector value={f.teamFluency} onChange={(v) => set("teamFluency", v)} type="team" hasError={missing("teamFluency")} />
            </article>

            {/* 6. Failure Risks */}
            <article className="panel animate-fade-in" style={{ animationDelay: "0.26s" }}>
              <label className="field-label">What would make AI adoption fail on your team?</label>
              <p className="field-desc">If AI adoption stalls or fails on your team, what are the most likely reasons?</p>
              <TextareaWithGuide value={f.failureRisks} onChange={(e) => set("failureRisks", e.target.value)} placeholder="e.g., My two senior architects think AI-generated work is beneath them, and the rest of the team follows their lead" hasError={missing("failureRisks")} />
            </article>

            {/* 7. Success Vision */}
            <article className="panel animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <label className="field-label">What does success look like in 90 days?</label>
              <p className="field-desc">If everything goes well, what does your team's AI usage look like 3 months from now?</p>
              <TextareaWithGuide value={f.successVision} onChange={(e) => set("successVision", e.target.value)} placeholder="e.g., Every CSM uses AI to prep for client calls, and we've cut QBR prep time in half" hasError={missing("successVision")} />
            </article>

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

        <aside className="intake-aside">
          <div className="intake-aside-sticky">
            <article className="panel animate-fade-in" style={{ background: C.charcoal, color: C.white, borderColor: C.charcoal }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Input Guidance</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
                The more specific you are, the better AI can personalize your use cases and change strategy.
              </p>
              <ul style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", paddingLeft: 16 }}>
                <li style={{ marginBottom: 8 }}>Name your actual role and team size</li>
                <li style={{ marginBottom: 8 }}>Describe real tasks, not categories</li>
                <li style={{ marginBottom: 8 }}>Be honest about resistance factors</li>
                <li>Paint a concrete 90-day picture</li>
              </ul>
            </article>
          </div>
        </aside>
      </div>
    </div>
  );
}
