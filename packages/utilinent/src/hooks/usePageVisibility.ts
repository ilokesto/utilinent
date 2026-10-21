import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
  };
}

function getSnapshot(): boolean {
  return document.visibilityState === "visible";
}

function getServerSnapshot(): boolean {
  // Keep optional work paused until hydration can read the real document.
  return false;
}

/**
 * Returns whether the document is visible, updating on `visibilitychange`.
 * SSR and the first hydration snapshot return `false`.
 * Only reports state; consumers own any work and its cleanup.
 */
export function usePageVisibility(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
