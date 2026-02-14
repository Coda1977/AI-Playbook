import { useState, useCallback } from "react";
import { useApp } from "./context/AppContext";
import { generatePrimitives, generatePlaybook } from "./utils/api";
import { clearState } from "./utils/storage";
import { CATEGORIES } from "./config/categories";
import { RULES } from "./config/rules";
import PaperGrain from "./components/shared/PaperGrain";
import ErrorBanner from "./components/shared/ErrorBanner";
import Header from "./components/shared/Header";
import GeneratingIndicator from "./components/shared/GeneratingIndicator";
import ConfirmModal from "./components/shared/ConfirmModal";
import IntakeView from "./components/views/IntakeView";
import PrimitivesView from "./components/views/PrimitivesView";
import PlaybookView from "./components/views/PlaybookView";
import CommitmentView from "./components/views/CommitmentView";

export default function App() {
  const { state, dispatch } = useApp();
  const [genErr, setGenErr] = useState(null);

  // Primitives generation
  const [primitivesReady, setPrimitivesReady] = useState(false);
  const [pendingPrimitives, setPendingPrimitives] = useState(null);

  // Playbook generation
  const [playbookReady, setPlaybookReady] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  // Regeneration confirmation
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [pendingIntake, setPendingIntake] = useState(null);

  // Start over confirmation
  const [showStartOver, setShowStartOver] = useState(false);

  // Playbook re-generation confirmation (when going back then forward)
  const [showPlaybookRegen, setShowPlaybookRegen] = useState(false);

  const hasExistingPrimitives = CATEGORIES.some((c) => (state.primitives[c.id] || []).length > 0);

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
      setPendingPrimitives(primitives);
      setPrimitivesReady(true);
    } catch (err) {
      console.error("Primitives generation failed:", err);
      setGenErr("Something went wrong while discovering AI use cases. This usually means a connection issue.");
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

  const hasExistingPlan = RULES.some((r) => (state.plan[r.id] || []).length > 0);

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
      setPendingPlan(plan);
      setPlaybookReady(true);
    } catch (err) {
      console.error("Playbook generation failed:", err);
      setGenErr("Something went wrong while writing your playbook. This usually means a connection issue.");
      dispatch({ type: "SET_PHASE", phase: "primitives" });
    }
  };

  const handlePlaybookReady = useCallback(() => {
    if (pendingPlan) {
      dispatch({ type: "SET_PLAN", plan: pendingPlan });
      setPendingPlan(null);
    }
  }, [pendingPlan, dispatch]);

  const { phase } = state;

  return (
    <div className="app-root">
      <PaperGrain />

      {genErr && (phase === "intake" || phase === "primitives") && (
        <ErrorBanner message={genErr} onDismiss={() => setGenErr(null)} />
      )}

      <Header state={state} dispatch={dispatch} />

      <main className="app-main">
        {phase === "intake" && (
          <IntakeView state={state} dispatch={dispatch} onGenerate={handleGenerateRequest} />
        )}
        {phase === "generating-primitives" && (
          <GeneratingIndicator mode="primitives" onReady={primitivesReady ? handlePrimitivesReady : null} />
        )}
        {phase === "primitives" && (
          <PrimitivesView state={state} dispatch={dispatch} onContinue={handleContinueToPlaybook} onStartOver={() => setShowStartOver(true)} />
        )}
        {phase === "generating-playbook" && (
          <GeneratingIndicator mode="playbook" onReady={playbookReady ? handlePlaybookReady : null} />
        )}
        {phase === "playbook" && (
          <PlaybookView state={state} dispatch={dispatch} onStartOver={() => setShowStartOver(true)} />
        )}
        {phase === "commitment" && (
          <CommitmentView state={state} dispatch={dispatch} onStartOver={() => setShowStartOver(true)} />
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
