import { useState, useEffect, useRef } from "react";
import { Check, CheckCircle2, Loader2 } from "lucide-react";
import { C } from "../../config/constants";
import { CATEGORIES, PRIMITIVES_GEN_STEPS } from "../../config/categories";
import {
  RULES,
  PLAYBOOK_GEN_STEPS,
  SYNTHESIS_GEN_STEPS,
} from "../../config/rules";

const MODES = {
  primitives: {
    steps: PRIMITIVES_GEN_STEPS,
    items: CATEGORIES,
    eyebrow: "Step 2 · AI Use Cases",
    title: "Discovering AI use cases",
    subtitle: "Brainstorming ideas for your role...",
    readyTitle: "Your AI use cases are ready",
    nameFor: (i, items) => items[i].title,
    buildingLabel: "Building your AI use cases...",
  },
  playbook: {
    steps: PLAYBOOK_GEN_STEPS,
    items: RULES,
    eyebrow: "Step 3 · Change Strategy",
    title: "Writing your change strategy",
    subtitle: "Personalizing your actions...",
    readyTitle: "Your change strategy is ready",
    nameFor: (i, items, s) => `Rule ${s.rule}: ${items[i].name}`,
    buildingLabel: "Building your personalized strategy...",
  },
  synthesis: {
    steps: SYNTHESIS_GEN_STEPS,
    items: SYNTHESIS_GEN_STEPS,
    eyebrow: "Step 4 · Your Big Move",
    title: "Synthesizing your one-page plan",
    subtitle: "Clustering your work into a story...",
    readyTitle: "Your one-page plan is ready",
    nameFor: (i, items) => items[i].name,
    buildingLabel: "Writing your final plan...",
  },
};

export default function GeneratingIndicator({ mode, onReady }) {
  const config = MODES[mode] || MODES.primitives;
  const {
    steps,
    items,
    eyebrow,
    title,
    subtitle,
    readyTitle,
    nameFor,
    buildingLabel,
  } = config;

  const [step, setStep] = useState(0);
  const [stepsFinished, setStepsFinished] = useState(false);
  const [complete, setComplete] = useState(false);
  const [slow, setSlow] = useState(false);
  const calledRef = useRef(false);
  const resultReady = !!onReady;

  // Steps pace at 2200ms while we wait on the API. Once the result is in,
  // fast-forward the remaining steps instead of holding the full cadence.
  useEffect(() => {
    const iv = setInterval(
      () => {
        setStep((s) => {
          if (s >= steps.length) {
            clearInterval(iv);
            return s;
          }
          return s + 1;
        });
      },
      resultReady ? 200 : 2200,
    );
    return () => clearInterval(iv);
  }, [steps.length, resultReady]);

  // Surface a passive "this is taking longer than usual" note after 45s.
  // The fetch itself times out at 105s (see utils/api.js), at which point
  // App.jsx catches and reverts the phase + shows the retry banner.
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 45_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (step >= steps.length && !stepsFinished) {
      const t = setTimeout(() => setStepsFinished(true), 300);
      return () => clearTimeout(t);
    }
  }, [step, stepsFinished, steps.length]);

  useEffect(() => {
    if (stepsFinished && onReady && !complete) setComplete(true);
  }, [stepsFinished, onReady, complete]);

  useEffect(() => {
    if (complete && onReady && !calledRef.current) {
      calledRef.current = true;
      const t = setTimeout(onReady, 600);
      return () => clearTimeout(t);
    }
  }, [complete, onReady]);

  return (
    <div
      className={`generating-container ${complete ? "generating-complete" : ""}`}
    >
      <div className="gen-card">
        {complete ? (
          <div className="ready-beat animate-fade-in">
            <div className="ready-check">
              <CheckCircle2 size={48} color={C.accentDark} />
            </div>
            <h2 className="generating-title" style={{ marginTop: 20 }}>
              {readyTitle}
            </h2>
            <p className="generating-subtitle" style={{ opacity: 0.7 }}>
              Opening now...
            </p>
          </div>
        ) : (
          <>
            <span className="eyebrow-badge">{eyebrow}</span>
            <h2 className="generating-title">{title}</h2>
            <p className="generating-subtitle">{subtitle}</p>
            <div className="generating-steps">
              {steps.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <div
                    key={i}
                    className={`gen-step ${done ? "gen-done" : active ? "gen-active" : "gen-future"}`}
                  >
                    <div className="gen-step-icon">
                      {done ? (
                        <span className="gen-step-check">
                          <Check size={13} strokeWidth={3} color={C.accent} />
                        </span>
                      ) : active ? (
                        <span className="gen-step-spinner" />
                      ) : (
                        <span className="gen-step-empty" />
                      )}
                    </div>
                    <div>
                      <div className="gen-step-name">
                        {nameFor(i, items, s)}
                      </div>
                      {(done || active) && (
                        <div className="gen-step-tip animate-fade-in">
                          {s.tip}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {stepsFinished && (
              <div className="gen-building animate-fade-in">
                <Loader2 size={16} color={C.accentDark} className="spinning" />
                <span>{buildingLabel}</span>
              </div>
            )}
            {slow && !complete && (
              <div
                className="gen-slow animate-fade-in"
                role="status"
                aria-live="polite"
              >
                Taking longer than usual. Hang tight, we'll either finish or
                show a retry option soon.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
