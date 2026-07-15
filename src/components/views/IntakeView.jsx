import { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { HELP_OPTIONS } from "../../config/categories";
import { FLUENCY_OPTIONS } from "../../config/rules";
import GateBar from "../shared/GateBar";

function TextareaWithGuide({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  hasError,
}) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const hint =
    words === 0
      ? null
      : words <= 5
        ? "Add more detail for better personalization."
        : words <= 15
          ? "Good start - keep going for best results."
          : "Great detail - this will help create a strong plan.";
  const isGreat = words > 15;
  const hintId = `${id}-hint`;
  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`input-textarea ${hasError ? "input-error" : ""}`}
        aria-invalid={hasError ? "true" : undefined}
        aria-describedby={hint ? hintId : undefined}
      />
      {hint && (
        <p id={hintId} className={`input-hint ${isGreat ? "input-hint-great" : ""}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

function FluencySelector({ value, onChange, type, hasError, labelId }) {
  return (
    <div
      className={`fluency-grid ${hasError ? "fluency-grid-error" : ""}`}
      role="radiogroup"
      aria-labelledby={labelId}
    >
      {FLUENCY_OPTIONS.map((o) => {
        const d = type === "manager" ? o.managerDesc : o.teamDesc;
        const v = `${o.label} -- ${d}`;
        const sel = value === v;
        return (
          <button
            key={o.level}
            onClick={() => onChange(v)}
            type="button"
            role="radio"
            aria-checked={sel}
            className={`fluency-option ${sel ? "fluency-selected" : ""}`}
          >
            <div className="fluency-check">
              <div className="fluency-radio">
                <div className="fluency-radio-dot" />
              </div>
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
          <button
            key={o.id}
            onClick={() => onToggle(o.id)}
            type="button"
            aria-pressed={sel}
            className={`pill ${sel ? "on" : ""}`}
          >
            {sel && <Check size={14} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function IntakeView({ state, dispatch, onGenerate }) {
  const existing = state.intake;
  // Merge over the blank shape so partial drafts (and older saved states
  // missing newer keys) always have every field defined.
  const [f, setF] = useState(() => ({
    role: "",
    helpWith: [],
    responsibilities: "",
    managerFluency: "",
    teamFluency: "",
    failureRisks: "",
    successVision: "",
    ...existing,
  }));
  const [attempted, setAttempted] = useState(false);
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const formRef = useRef(null);

  // Auto-save the draft as the user types. Answers used to live only in
  // local state until submit, so a refresh or discarded tab lost everything.
  useEffect(() => {
    const t = setTimeout(() => {
      dispatch({ type: "SET_INTAKE", intake: f });
    }, 600);
    return () => clearTimeout(t);
  }, [f, dispatch]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleHelp = (id) =>
    setF((p) => ({
      ...p,
      helpWith: p.helpWith.includes(id)
        ? p.helpWith.filter((h) => h !== id)
        : [...p.helpWith, id],
    }));

  // Everything downstream is generated from these answers, so the gate
  // requires a minimum of substance, not just presence. Thresholds follow the
  // word-count bands the inline hints already use (more than 5 words = "good
  // start"); role can legitimately be shorter.
  const words = (s) =>
    s && s.trim() ? s.trim().split(/\s+/).length : 0;
  const fieldOk = {
    role: words(f.role) >= 4,
    helpWith: f.helpWith.length > 0,
    responsibilities: words(f.responsibilities) >= 6,
    managerFluency: !!f.managerFluency,
    teamFluency: !!f.teamFluency,
    failureRisks: words(f.failureRisks) >= 6,
    successVision: words(f.successVision) >= 6,
  };
  const ok = Object.values(fieldOk).every(Boolean);
  const doneCount = Object.values(fieldOk).filter(Boolean).length;

  const missing = (field) => attempted && !fieldOk[field];
  const missingArray = (field) => attempted && !fieldOk[field];

  // The synchronous DOM query used to run in handleSubmit itself, before
  // React had rendered the error classes triggered by setAttempted(true).
  // Deferring the scroll/focus to an effect keyed off submitAttempt lets it
  // run after the error state has actually painted.
  useEffect(() => {
    if (submitAttempt === 0) return;
    const first = formRef.current?.querySelector(
      ".input-error, .fluency-grid-error",
    );
    if (!first) return;
    const control = first.matches("textarea, button")
      ? first
      : first.querySelector("textarea, button");
    control?.focus({ preventScroll: true });
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    first.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [submitAttempt]);

  const handleSubmit = () => {
    if (ok) {
      dispatch({ type: "SET_INTAKE", intake: f });
      onGenerate(f);
    } else {
      setAttempted(true);
      setSubmitAttempt((n) => n + 1);
    }
  };

  return (
    <div className="intake-container" ref={formRef}>
      <div className="intake-body">
        {/* Hero -- light, on the page background. Kept outside .intake-split
            (rather than as .intake-main's first child) so the mobile
            guidance-above-fields reorder can move the guidance card above
            the fields without also displacing the page title. */}
        <div className="intake-hero animate-fade-in">
          <span className="eyebrow-badge">Personalized AI Playbook</span>
          <h1 className="intake-title">
            Map Your AI Potential & Build Your Change Strategy
          </h1>
          <p className="intake-subtitle">
            Answer seven questions about your role and team. AI will
            discover use cases tailored to you, then build a personalized
            change strategy grounded in behavioral science.
          </p>
        </div>
        <div className="intake-split">
          <div className="intake-main">
            {attempted && !ok && (
              <div
                className="intake-validation-msg animate-fade-in"
                role="alert"
              >
                Please complete the highlighted fields. Short answers need a
                few more words; they drive everything the AI builds for you.
              </div>
            )}

            <div className="intake-fields">
              {/* 1. Role */}
              <article
                className="panel animate-fade-in"
                style={{ animationDelay: "0.06s" }}
              >
                <label className="field-label" htmlFor="intake-role">Your role and team</label>
                <p className="field-desc">
                  What's your role, and what does your team do day-to-day?
                </p>
                <TextareaWithGuide
                  id="intake-role"
                  value={f.role}
                  onChange={(e) => set("role", e.target.value)}
                  placeholder="e.g., VP of Customer Success leading a 12-person team across onboarding, support, and renewals"
                  hasError={missing("role")}
                />
              </article>

              {/* 2. Help With -- Pill buttons */}
              <article
                className="panel animate-fade-in"
                style={{ animationDelay: "0.1s" }}
              >
                <label className="field-label">What would help you most?</label>
                <p className="field-desc">
                  Select all that apply - these shape the AI use cases we'll
                  discover.
                </p>
                <HelpPills
                  selected={f.helpWith}
                  onToggle={toggleHelp}
                  hasError={missingArray("helpWith")}
                />
              </article>

              {/* 3. Responsibilities */}
              <article
                className="panel animate-fade-in"
                style={{ animationDelay: "0.14s" }}
              >
                <label className="field-label" htmlFor="intake-responsibilities">
                  Your main responsibilities
                </label>
                <p className="field-desc">
                  What do you spend most of your time on?
                </p>
                <TextareaWithGuide
                  id="intake-responsibilities"
                  value={f.responsibilities}
                  onChange={(e) => set("responsibilities", e.target.value)}
                  placeholder="e.g., Campaign planning, team coordination, stakeholder reporting, client QBRs"
                  hasError={missing("responsibilities")}
                />
              </article>

              {/* 4. Manager Fluency */}
              <article
                className="panel animate-fade-in"
                style={{ animationDelay: "0.18s" }}
              >
                <label className="field-label" id="intake-managerFluency-label">Your own AI fluency</label>
                <p className="field-desc">
                  How would you describe your own AI usage right now?
                </p>
                <FluencySelector
                  value={f.managerFluency}
                  onChange={(v) => set("managerFluency", v)}
                  type="manager"
                  hasError={missing("managerFluency")}
                  labelId="intake-managerFluency-label"
                />
              </article>

              {/* 5. Team Fluency */}
              <article
                className="panel animate-fade-in"
                style={{ animationDelay: "0.22s" }}
              >
                <label className="field-label" id="intake-teamFluency-label">Your team's AI fluency</label>
                <p className="field-desc">
                  How would you describe your team's AI usage overall?
                </p>
                <FluencySelector
                  value={f.teamFluency}
                  onChange={(v) => set("teamFluency", v)}
                  type="team"
                  hasError={missing("teamFluency")}
                  labelId="intake-teamFluency-label"
                />
              </article>

              {/* 6. Failure Risks */}
              <article
                className="panel animate-fade-in"
                style={{ animationDelay: "0.26s" }}
              >
                <label className="field-label" htmlFor="intake-failureRisks">
                  What would make AI adoption fail on your team?
                </label>
                <p className="field-desc">
                  If AI adoption stalls or fails on your team, what are the most
                  likely reasons?
                </p>
                <TextareaWithGuide
                  id="intake-failureRisks"
                  value={f.failureRisks}
                  onChange={(e) => set("failureRisks", e.target.value)}
                  placeholder="e.g., My two senior architects think AI-generated work is beneath them, and the rest of the team follows their lead"
                  hasError={missing("failureRisks")}
                />
              </article>

              {/* 7. Success Vision */}
              <article
                className="panel animate-fade-in"
                style={{ animationDelay: "0.3s" }}
              >
                <label className="field-label" htmlFor="intake-successVision">
                  What does success look like in 90 days?
                </label>
                <p className="field-desc">
                  If everything goes well, what does your team's AI usage look
                  like 3 months from now?
                </p>
                <TextareaWithGuide
                  id="intake-successVision"
                  value={f.successVision}
                  onChange={(e) => set("successVision", e.target.value)}
                  placeholder="e.g., Every CSM uses AI to prep for client calls, and we've cut QBR prep time in half"
                  hasError={missing("successVision")}
                />
              </article>
            </div>
          </div>

          <aside className="intake-aside">
            <div className="intake-aside-sticky">
              <article className="intake-guidance animate-fade-in">
                <h3 className="intake-guidance-heading">Input Guidance</h3>
                <p className="intake-guidance-intro">
                  The more specific you are, the better AI can personalize your
                  use cases and change strategy.
                </p>
                <ul className="intake-guidance-tips">
                  <li>Name your actual role and team size</li>
                  <li>Describe real tasks, not categories</li>
                  <li>Be honest about resistance factors</li>
                  <li>Paint a concrete 90-day picture</li>
                </ul>
              </article>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky gate bar */}
      <GateBar
        left={
          <>
            <strong>{doneCount}</strong> of 7 fields
          </>
        }
        hint={
          ok
            ? "Ready to discover your use cases"
            : "Complete all fields to continue"
        }
      >
        {/* No `disabled` attribute: clicking while invalid is what flips
            `attempted` to true, which drives the field-level error
            highlighting, the validation banner, and this shake. */}
        <button
          onClick={handleSubmit}
          className={`btn-pill ${attempted && !ok ? "btn-shake" : ""}`}
        >
          Discover use cases
        </button>
      </GateBar>
    </div>
  );
}
