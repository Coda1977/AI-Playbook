/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useEffect } from "react";
import { uid } from "../config/constants";
import { loadState, saveState } from "../utils/storage";
export { FlashProvider, useFlash } from "./FlashContext";

// Hard ceiling on per-chat message history. Anything older than this is pruned
// from the tail to keep localStorage well under quota. We always preserve the
// first message (the static opener dispatched on chat mount) so the thread
// reads naturally on rehydrate.
const MAX_CHAT_MESSAGES = 30;
function capChatHistory(arr, next) {
  const appended = [...(arr || []), next];
  if (appended.length <= MAX_CHAT_MESSAGES) return appended;
  const opener = appended[0];
  const tail = appended.slice(-(MAX_CHAT_MESSAGES - 1));
  return [opener, ...tail];
}

const INIT = {
  phase: "intake",
  intake: {
    role: "",
    helpWith: [],
    responsibilities: "",
    managerFluency: "",
    teamFluency: "",
    failureRisks: "",
    successVision: "",
  },
  primitives: {
    content: [],
    automation: [],
    research: [],
    data: [],
    coding: [],
    ideation: [],
  },
  primitivesChat: {},
  plan: { destination: [], safe: [], script: [], small: [], visible: [] },
  playbookChat: {},
  synthesis: null,
  // contentVersion bumps on every mutation of ideas/actions/stars;
  // synthesisVersion records the contentVersion the Big Move was generated
  // from. A mismatch means the synthesis is stale and should be regenerated.
  contentVersion: 0,
  synthesisVersion: 0,
};

// Actions that change the content the synthesis is derived from.
const CONTENT_ACTIONS = new Set([
  "SET_PRIMITIVES",
  "ADD_PRIMITIVE",
  "UPDATE_PRIMITIVE",
  "DELETE_PRIMITIVE",
  "TOGGLE_PRIMITIVE_STAR",
  "SET_PLAN",
  "ADD_ACTION",
  "UPDATE_ACTION",
  "DELETE_ACTION",
  "TOGGLE_STAR",
  "RESTORE_ITEM",
]);

function reducer(state, action) {
  const next = baseReducer(state, action);
  if (next === state) return next;

  // Undoing a delete puts the exact item back at its exact index, so the
  // content is byte-identical to what it was before the delete -- bumping
  // contentVersion here would falsely age the Big Move and push the user to
  // regenerate an identical plan. Hand the version back instead.
  //
  // Only when this restore is a true inverse: prevContentVersion + 1 is the
  // version the delete itself produced, so if contentVersion still equals it,
  // nothing else has touched the content in between. If something has (a
  // second delete, an edit, a star), the restore is a genuine change on top
  // of that and bumps like any other mutation.
  if (action.type === "RESTORE_ITEM" && action.prevContentVersion != null) {
    if ((state.contentVersion || 0) === action.prevContentVersion + 1) {
      return { ...next, contentVersion: action.prevContentVersion };
    }
  }

  if (CONTENT_ACTIONS.has(action.type)) {
    return { ...next, contentVersion: (state.contentVersion || 0) + 1 };
  }
  return next;
}

function baseReducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...INIT, ...action.state };
    case "SET_PHASE":
      return { ...state, phase: action.phase };
    case "SET_INTAKE":
      return { ...state, intake: action.intake };

    // --- Primitives ---
    case "SET_PRIMITIVES": {
      const primitives = {};
      for (const [k, v] of Object.entries(action.primitives)) {
        primitives[k] = v.map((t) => ({
          id: uid(),
          text: t,
          starred: false,
          source: "ai",
        }));
      }
      return { ...state, primitives, phase: "primitives" };
    }
    case "ADD_PRIMITIVE":
      return {
        ...state,
        primitives: {
          ...state.primitives,
          [action.categoryId]: [
            ...(state.primitives[action.categoryId] || []),
            {
              id: uid(),
              text: action.text,
              starred: false,
              source: action.source || "manual",
            },
          ],
        },
      };
    case "UPDATE_PRIMITIVE":
      return {
        ...state,
        primitives: {
          ...state.primitives,
          [action.categoryId]: (state.primitives[action.categoryId] || []).map(
            (x) => (x.id === action.ideaId ? { ...x, text: action.text } : x),
          ),
        },
      };
    case "DELETE_PRIMITIVE":
      return {
        ...state,
        primitives: {
          ...state.primitives,
          [action.categoryId]: (
            state.primitives[action.categoryId] || []
          ).filter((x) => x.id !== action.ideaId),
        },
      };
    case "TOGGLE_PRIMITIVE_STAR":
      return {
        ...state,
        primitives: {
          ...state.primitives,
          [action.categoryId]: (state.primitives[action.categoryId] || []).map(
            (x) => (x.id === action.ideaId ? { ...x, starred: !x.starred } : x),
          ),
        },
      };
    case "ADD_PRIMITIVES_CHAT_MSG":
      return {
        ...state,
        primitivesChat: {
          ...state.primitivesChat,
          [action.categoryId]: capChatHistory(
            state.primitivesChat[action.categoryId],
            action.message,
          ),
        },
      };
    case "MARK_PRIMITIVE_IDEA_ADDED": {
      const msgs = [...(state.primitivesChat[action.categoryId] || [])];
      const m = { ...msgs[action.msgIdx] };
      const ideas = [...(m.ideas || [])];
      ideas[action.ideaIdx] = { ...ideas[action.ideaIdx], added: true };
      m.ideas = ideas;
      msgs[action.msgIdx] = m;
      return {
        ...state,
        primitivesChat: { ...state.primitivesChat, [action.categoryId]: msgs },
      };
    }

    // --- Playbook ---
    case "SET_PLAN": {
      const plan = {};
      for (const [k, v] of Object.entries(action.plan)) {
        plan[k] = v.map((t) => ({
          id: uid(),
          text: t,
          starred: false,
          source: "ai",
        }));
      }
      return { ...state, plan, phase: "playbook" };
    }
    case "ADD_ACTION":
      return {
        ...state,
        plan: {
          ...state.plan,
          [action.ruleId]: [
            ...(state.plan[action.ruleId] || []),
            {
              id: uid(),
              text: action.text,
              starred: false,
              source: action.source || "manual",
            },
          ],
        },
      };
    case "UPDATE_ACTION":
      return {
        ...state,
        plan: {
          ...state.plan,
          [action.ruleId]: (state.plan[action.ruleId] || []).map((x) =>
            x.id === action.actionId ? { ...x, text: action.text } : x,
          ),
        },
      };
    case "DELETE_ACTION":
      return {
        ...state,
        plan: {
          ...state.plan,
          [action.ruleId]: (state.plan[action.ruleId] || []).filter(
            (x) => x.id !== action.actionId,
          ),
        },
      };
    case "TOGGLE_STAR":
      return {
        ...state,
        plan: {
          ...state.plan,
          [action.ruleId]: (state.plan[action.ruleId] || []).map((x) =>
            x.id === action.actionId ? { ...x, starred: !x.starred } : x,
          ),
        },
      };
    case "ADD_CHAT_MSG":
      return {
        ...state,
        playbookChat: {
          ...state.playbookChat,
          [action.ruleId]: capChatHistory(
            state.playbookChat[action.ruleId],
            action.message,
          ),
        },
      };
    case "MARK_IDEA_ADDED": {
      const msgs = [...(state.playbookChat[action.ruleId] || [])];
      const m = { ...msgs[action.msgIdx] };
      const ideas = [...(m.ideas || [])];
      ideas[action.ideaIdx] = { ...ideas[action.ideaIdx], added: true };
      m.ideas = ideas;
      msgs[action.msgIdx] = m;
      return {
        ...state,
        playbookChat: { ...state.playbookChat, [action.ruleId]: msgs },
      };
    }

    // --- Shared (delete-undo) ---
    case "RESTORE_ITEM": {
      const key = action.kind === "primitive" ? "primitives" : "plan";
      const list = [...(state[key][action.containerId] || [])];
      const i = Math.max(0, Math.min(action.index, list.length));
      list.splice(i, 0, action.item);
      return { ...state, [key]: { ...state[key], [action.containerId]: list } };
    }

    case "SET_SYNTHESIS":
      return {
        ...state,
        synthesis: action.synthesis
          ? {
              ...action.synthesis,
              generatedAt: action.synthesis.generatedAt || Date.now(),
            }
          : action.synthesis,
        synthesisVersion: state.contentVersion || 0,
        phase: "synthesis",
      };
    case "RESET":
      return { ...INIT };
    default:
      return state;
  }
}

const AppContext = createContext(null);

// A persisted "generating-*" phase means the page was closed or refreshed
// mid-generation. The in-flight request is gone, so rehydrating into it
// strands the user on a progress screen that never resolves. Snap back to
// the phase the generation started from.
const GENERATING_FALLBACK = {
  "generating-primitives": "intake",
  "generating-playbook": "primitives",
  "generating-synthesis": "commitment",
};

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INIT, () => {
    const saved = loadState();
    if (!saved || !saved.phase) return INIT;
    const phase = GENERATING_FALLBACK[saved.phase] || saved.phase;
    return { ...INIT, ...saved, phase };
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
