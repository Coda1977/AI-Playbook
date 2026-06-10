import { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Loader2,
  Circle,
  FileText,
} from "lucide-react";
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
    title: "Discovering AI use cases",
    subtitle: "Brainstorming ideas for your role...",
    readyTitle: "Your AI use cases are ready",
    icon: Sparkles,
    nameFor: (i, items) => items[i].title,
    buildingLabel: "Building your AI use cases...",
  },
  playbook: {
    steps: PLAYBOOK_GEN_STEPS,
    items: RULES,
    title: "Writing your change strategy",
    subtitle: "Personalizing your actions...",
    readyTitle: "Your change strategy is ready",
    icon: BookOpen,
    nameFor: (i, items, s) => `Rule ${s.rule}: ${items[i].name}`,
    buildingLabel: "Building your personalized strategy...",
  },
  synthesis: {
    steps: SYNTHESIS_GEN_STEPS,
    items: SYNTHESIS_GEN_STEPS,
    title: "Synthesizing your one-page plan",
    subtitle: "Clustering your work into a story...",
    readyTitle: "Your one-page plan is ready",
    icon: FileText,
    nameFor: (i, items) => items[i].name,
    buildingLabel: "Writing your final plan...",
  },
};

export default function GeneratingIndicator({ mode, onReady }) {
  const config = MODES[mode] || MODES.primitives;
  const {
    steps,
    items,
    title,
    subtitle,
    readyTitle,
    icon: Icon,
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
      resultReady ? 350 : 2200,
    );
    return () => clearInterval(iv);
  }, [steps.length, resultReady]);

  // Surface a passive "this is taking longer than usual" note after 45s.
  // The fetch itself times out at 75s (see utils/api.js), at which point
  // App.jsx catches and reverts the phase + shows the retry banner.
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 45_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (step >= steps.length && !stepsFinished) {
      const t = setTimeout(() => setStepsFinished(true), 600);
      return () => clearTimeout(t);
    }
  }, [step, stepsFinished, steps.length]);

  useEffect(() => {
    if (stepsFinished && onReady && !complete) setComplete(true);
  }, [stepsFinished, onReady, complete]);

  useEffect(() => {
    if (complete && onReady && !calledRef.current) {
      calledRef.current = true;
      const t = setTimeout(onReady, 1200);
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
              <CheckCircle2 size={48} color={C.red} />
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
            <div className="generating-icon">
              <Icon size={32} color={C.red} />
            </div>
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
                    <div
                      className={`gen-step-icon ${active ? "gen-step-icon-active" : ""}`}
                    >
                      {done ? (
                        <CheckCircle2 size={18} color={C.red} />
                      ) : active ? (
                        <Loader2 size={18} color={C.red} className="spinning" />
                      ) : (
                        <Circle size={18} color={C.border} />
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
              <div className="gen-progress-bar">
                <div
                  className="gen-progress-fill"
                  style={{ "--progress": Math.min(step / steps.length, 1) }}
                />
              </div>
              <div className="gen-progress-label">
                {Math.min(Math.round((step / steps.length) * 100), 100)}%
              </div>
            </div>
            {stepsFinished && (
              <div className="gen-building animate-fade-in">
                <Loader2 size={16} color={C.red} className="spinning" />
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
