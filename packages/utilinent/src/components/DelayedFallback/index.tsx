import { createProxy } from "../../core/createProxy";
import { createTagRenderer } from "../../core/createTagRenderer";
import { usePendingDelay } from "../../hooks/usePendingDelay";
import type { DelayedFallbackProps, DelayedFallbackType } from "./types";

export type { DelayedFallbackProps, DelayedFallbackType } from "./types";

function BaseDelayedFallback({
  pending,
  delay,
  minDuration,
  children,
  fallback = null,
}: DelayedFallbackProps) {
  const isVisible = usePendingDelay(pending, { delay, minDuration });
  return <>{isVisible ? fallback : children}</>;
}

const renderForTag = createTagRenderer(
  (props: DelayedFallbackProps) => <BaseDelayedFallback {...props} />,
  ["pending", "delay", "minDuration", "children", "fallback"],
);

/**
 * Replaces children with fallback only while delayed pending UI is visible.
 * Children remain visible during the delay and return after the minimum hold.
 * Tag variants keep their wrapper mounted and forward host props and refs.
 */
export const DelayedFallback: DelayedFallbackType = createProxy(
  BaseDelayedFallback,
  renderForTag,
  "delayedFallback",
);
