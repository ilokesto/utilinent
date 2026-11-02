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
 * @description Returns whether the document is visible, updating on `visibilitychange`.
 * SSR and the first hydration snapshot return `false`.
 * Only reports state; consumers own any work and its cleanup.
 *
 * @returns {boolean} True only when document.visibilityState is "visible".
 * @example
 * ```tsx
 * const visible = usePageVisibility();
 * return <span>{visible ? 'Page active' : 'Page hidden'}</span>;
 * ```
 */
export function usePageVisibility(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
