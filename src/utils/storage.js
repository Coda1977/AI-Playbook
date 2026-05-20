import { LS_KEY } from "../config/constants";

export const STORAGE_QUOTA_EVENT = "ai-playbook:storage-quota-exceeded";

function isQuotaError(err) {
  if (!err) return false;
  // Standard DOMException
  if (err.name === "QuotaExceededError") return true;
  // Firefox legacy
  if (err.name === "NS_ERROR_DOM_QUOTA_REACHED") return true;
  // Webkit numeric code
  if (err.code === 22 || err.code === 1014) return true;
  return false;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.phase) return parsed;
    }
  } catch (err) {
    console.warn("loadState: localStorage read failed:", err?.message || err);
  }
  return null;
}

export function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn(
        "saveState: localStorage quota exceeded, state not persisted",
      );
      if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
        window.dispatchEvent(new CustomEvent(STORAGE_QUOTA_EVENT));
      }
    } else {
      console.warn(
        "saveState: localStorage write failed:",
        err?.message || err,
      );
    }
    return false;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch (err) {
    console.warn(
      "clearState: localStorage remove failed:",
      err?.message || err,
    );
  }
}
