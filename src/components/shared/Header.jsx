import PhaseProgress from "./PhaseProgress";
import { truncateRole } from "../../utils/text";

export default function Header({ state, dispatch }) {
  const { phase, intake } = state;
  const isGenerating =
    phase === "generating-primitives" ||
    phase === "generating-playbook" ||
    phase === "generating-synthesis";
  const showRole = intake.role && phase !== "intake" && !isGenerating;

  return (
    <header className="header no-print">
      <div className="header-inner">
        <div className="header-left">
          <span className="brand-mark" />
          <span className="header-title">AI Playbook</span>
          {showRole && (
            <>
              <span className="header-divider">|</span>
              <span className="header-role" title={intake.role}>
                {truncateRole(intake.role)}
              </span>
            </>
          )}
        </div>
        <nav className="header-actions" aria-label="Workshop progress">
          <PhaseProgress
            phase={phase}
            dispatch={dispatch}
            isGenerating={isGenerating}
          />
        </nav>
      </div>
    </header>
  );
}
