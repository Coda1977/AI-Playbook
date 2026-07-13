import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "./context/AppContext";
import { useToast } from "./context/ToastContext";
import {
  generatePrimitives,
  generatePlaybook,
  generateSynthesis,
  describeApiError,
} from "./utils/api";
import { clearState, STORAGE_QUOTA_EVENT } from "./utils/storage";
import { CATEGORIES } from "./config/categories";
import { RULES } from "./config/rules";
import ErrorBanner from "./components/shared/ErrorBanner";
import Header from "./components/shared/Header";
import GeneratingIndicator from "./components/shared/GeneratingIndicator";
import ConfirmModal from "./components/shared/ConfirmModal";
import IntakeView from "./components/views/IntakeView";
import PrimitivesView from "./components/views/PrimitivesView";
import PlaybookView from "./components/views/PlaybookView";
import CommitmentView from "./components/views/CommitmentView";
import SynthesisView from "./components/views/SynthesisView";

export default function App() {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [genErr, setGenErr] = useState(null);
  const quotaWarnedRef = useRef(false);
  const lastFailureRef = useRef(null);

  useEffect(() => {
    const onQuota = () => {
      if (quotaWarnedRef.current) return;
      quotaWarnedRef.current = true;
      showToast(
        "We couldn't save your latest changes. Export your Word doc to capture this work.",
      );
    };
    window.addEventListener(STORAGE_QUOTA_EVENT, onQuota);
    return () => window.removeEventListener(STORAGE_QUOTA_EVENT, onQuota);
  }, [showToast]);

  // The SPA preserves window scroll position across phase switches by
  // default (it's one document, not a route change), which left pages like
  // Review->Big Move opening scrolled to wherever the triggering click was.
  // Board panes (Primitives/Playbook) reset via remount already; this
  // covers the document-scroll pages (Intake, Review, Big Move poster).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.phase]);

  // Primitives generation
  const [primitivesReady, setPrimitivesReady] = useState(false);
  const [pendingPrimitives, setPendingPrimitives] = useState(null);

  // Playbook generation
  const [playbookReady, setPlaybookReady] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  // Synthesis generation
  const [synthesisReady, setSynthesisReady] = useState(false);
  const [pendingSynthesis, setPendingSynthesis] = useState(null);

  // Regeneration confirmation
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [pendingIntake, setPendingIntake] = useState(null);

  // Start over confirmation
  const [showStartOver, setShowStartOver] = useState(false);

  // Playbook re-generation confirmation (when going back then forward)
  const [showPlaybookRegen, setShowPlaybookRegen] = useState(false);

  const hasExistingPrimitives = CATEGORIES.some(
    (c) => (state.primitives[c.id] || []).length > 0,
  );

  const handleGenerateRequest = (intake) => {
    if (hasExistingPrimitives) {
      setPendingIntake(intake);
      setShowRegenConfirm(true);
    } else {
      handleGeneratePrimitives(intake);
    }
  };

  const handleGeneratePrimitives = async (intake) => {
    setGenErr(null);
    setPrimitivesReady(false);
    setPendingPrimitives(null);
    dispatch({ type: "SET_PHASE", phase: "generating-primitives" });
    try {
      const primitives = await generatePrimitives(intake);
      lastFailureRef.current = null;
      setPendingPrimitives(primitives);
      setPrimitivesReady(true);
    } catch (err) {
      console.error("Primitives generation failed:", err);
      lastFailureRef.current = { kind: "primitives", args: intake };
      setGenErr(
        describeApiError(
          err,
          "Something went wrong while discovering AI use cases.",
        ),
      );
      dispatch({ type: "SET_PHASE", phase: "intake" });
    }
  };

  const handlePrimitivesReady = useCallback(() => {
    if (pendingPrimitives) {
      dispatch({ type: "SET_PRIMITIVES", primitives: pendingPrimitives });
      setPendingPrimitives(null);
    }
  }, [pendingPrimitives, dispatch]);

  const getStarredPrimitives = () => {
    const starred = [];
    for (const cat of CATEGORIES) {
      (state.primitives[cat.id] || [])
        .filter((i) => i.starred)
        .forEach((i) => starred.push({ category: cat.title, text: i.text }));
    }
    return starred;
  };

  const hasExistingPlan = RULES.some(
    (r) => (state.plan[r.id] || []).length > 0,
  );

  const handleContinueToPlaybook = () => {
    if (hasExistingPlan) {
      setShowPlaybookRegen(true);
    } else {
      doGeneratePlaybook();
    }
  };

  const doGeneratePlaybook = async () => {
    setGenErr(null);
    setPlaybookReady(false);
    setPendingPlan(null);
    dispatch({ type: "SET_PHASE", phase: "generating-playbook" });
    try {
      const starredPrimitives = getStarredPrimitives();
      const plan = await generatePlaybook(state.intake, starredPrimitives);
      lastFailureRef.current = null;
      setPendingPlan(plan);
      setPlaybookReady(true);
    } catch (err) {
      console.error("Playbook generation failed:", err);
      lastFailureRef.current = { kind: "playbook" };
      setGenErr(
        describeApiError(
          err,
          "Something went wrong while writing your playbook.",
        ),
      );
      dispatch({ type: "SET_PHASE", phase: "primitives" });
    }
  };

  const handlePlaybookReady = useCallback(() => {
    if (pendingPlan) {
      dispatch({ type: "SET_PLAN", plan: pendingPlan });
      setPendingPlan(null);
    }
  }, [pendingPlan, dispatch]);

  const handleGenerateSynthesis = async () => {
    setGenErr(null);
    setSynthesisReady(false);
    setPendingSynthesis(null);
    dispatch({ type: "SET_PHASE", phase: "generating-synthesis" });
    try {
      const synthesis = await generateSynthesis(
        state.intake,
        state.primitives,
        state.plan,
      );
      lastFailureRef.current = null;
      setPendingSynthesis(synthesis);
      setSynthesisReady(true);
    } catch (err) {
      console.error("Synthesis generation failed:", err);
      lastFailureRef.current = { kind: "synthesis" };
      setGenErr(
        describeApiError(err, "Something went wrong while writing your plan."),
      );
      dispatch({ type: "SET_PHASE", phase: "commitment" });
    }
  };

  const handleRetry = () => {
    const last = lastFailureRef.current;
    if (!last) return;
    setGenErr(null);
    if (last.kind === "primitives") handleGeneratePrimitives(last.args);
    else if (last.kind === "playbook") doGeneratePlaybook();
    else if (last.kind === "synthesis") handleGenerateSynthesis();
  };

  const handleSynthesisReady = useCallback(() => {
    if (pendingSynthesis) {
      dispatch({ type: "SET_SYNTHESIS", synthesis: pendingSynthesis });
      setPendingSynthesis(null);
    }
  }, [pendingSynthesis, dispatch]);

  const { phase } = state;

  return (
    <div className="app-root">
      {genErr &&
        (phase === "intake" ||
          phase === "primitives" ||
          phase === "playbook" ||
          phase === "commitment") && (
          <ErrorBanner
            message={genErr}
            onRetry={handleRetry}
            onDismiss={() => setGenErr(null)}
          />
        )}

      <Header state={state} dispatch={dispatch} />

      <main className="app-main">
        {phase === "intake" && (
          <IntakeView
            state={state}
            dispatch={dispatch}
            onGenerate={handleGenerateRequest}
          />
        )}
        {phase === "generating-primitives" && (
          <GeneratingIndicator
            mode="primitives"
            onReady={primitivesReady ? handlePrimitivesReady : null}
          />
        )}
        {phase === "primitives" && (
          <PrimitivesView
            state={state}
            dispatch={dispatch}
            onContinue={handleContinueToPlaybook}
            onStartOver={() => setShowStartOver(true)}
          />
        )}
        {phase === "generating-playbook" && (
          <GeneratingIndicator
            mode="playbook"
            onReady={playbookReady ? handlePlaybookReady : null}
          />
        )}
        {phase === "playbook" && (
          <PlaybookView
            state={state}
            dispatch={dispatch}
            onStartOver={() => setShowStartOver(true)}
          />
        )}
        {phase === "commitment" && (
          <CommitmentView
            state={state}
            dispatch={dispatch}
            onStartOver={() => setShowStartOver(true)}
            onGenerateSynthesis={handleGenerateSynthesis}
          />
        )}
        {phase === "generating-synthesis" && (
          <GeneratingIndicator
            mode="synthesis"
            onReady={synthesisReady ? handleSynthesisReady : null}
          />
        )}
        {phase === "synthesis" && (
          <SynthesisView state={state} dispatch={dispatch} />
        )}
      </main>

      <ConfirmModal
        open={showRegenConfirm}
        title="Replace existing ideas?"
        message="This will replace all existing ideas, including starred items. This can't be undone."
        confirmLabel="Yes, regenerate"
        onConfirm={() => {
          setShowRegenConfirm(false);
          if (pendingIntake) {
            handleGeneratePrimitives(pendingIntake);
            setPendingIntake(null);
          }
        }}
        onCancel={() => {
          setShowRegenConfirm(false);
          setPendingIntake(null);
        }}
      />

      <ConfirmModal
        open={showStartOver}
        title="Start fresh?"
        message="This will clear everything - all ideas, actions, stars, and conversations. You can't undo this."
        confirmLabel="Yes, start fresh"
        onConfirm={() => {
          setShowStartOver(false);
          clearState();
          dispatch({ type: "RESET" });
        }}
        onCancel={() => setShowStartOver(false)}
      />

      <ConfirmModal
        open={showPlaybookRegen}
        title="You already have a change strategy"
        message="Would you like to regenerate it based on your current starred ideas, or keep your existing strategy and edits?"
        confirmLabel="Regenerate"
        cancelLabel="Keep current"
        onConfirm={() => {
          setShowPlaybookRegen(false);
          doGeneratePlaybook();
        }}
        onCancel={() => {
          setShowPlaybookRegen(false);
          dispatch({ type: "SET_PHASE", phase: "playbook" });
        }}
      />
    </div>
  );
}
