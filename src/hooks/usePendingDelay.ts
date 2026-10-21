import { useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

export interface UsePendingDelayOptions {
  /** Milliseconds before showing pending UI. Defaults to 200. */
  delay?: number;
  /** Minimum visible milliseconds, measured from reveal. Defaults to 300. */
  minDuration?: number;
}

function normalizeDuration(duration: number): number {
  return Number.isFinite(duration) ? Math.min(2_147_483_647, Math.max(0, duration)) : 0;
}

/**
 * Delays pending UI and keeps it visible for a minimum duration.
 *
 * Option changes use the original pending/reveal timestamps. A new pending
 * period during the minimum hold keeps the existing reveal timestamp.
 * SSR and the first hydration render return false; timing starts on mount.
 */
export function usePendingDelay(
  pending: boolean,
  { delay = 200, minDuration = 300 }: UsePendingDelayOptions = {},
): boolean {
  const [isVisible, setIsVisible] = useState(false);
  const pendingSince = useRef<number | null>(null);
  const visibleSince = useRef<number | null>(null);
  const delayMs = normalizeDuration(delay);
  const minDurationMs = normalizeDuration(minDuration);

  useIsomorphicLayoutEffect(() => {
    const now = performance.now();
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (isVisible) {
      // Start the hold at the visible commit, not when a queued timer fired.
      visibleSince.current ??= now;
      pendingSince.current = null;
      if (pending) {
        return;
      }
      const remaining = minDurationMs - (now - visibleSince.current);

      if (remaining <= 0) {
        setIsVisible(false);
      } else {
        timer = setTimeout(() => setIsVisible(false), remaining);
      }
    } else {
      visibleSince.current = null;
      if (!pending) {
        pendingSince.current = null;
        return;
      }
      pendingSince.current ??= now;
      const remaining = delayMs - (now - pendingSince.current);

      if (remaining <= 0) {
        setIsVisible(true);
      } else {
        timer = setTimeout(() => setIsVisible(true), remaining);
      }
    }

    return () => clearTimeout(timer);
  }, [pending, delayMs, minDurationMs, isVisible]);

  return isVisible;
}
