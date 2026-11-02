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
 * @description Replaces children with fallback only while delayed pending UI is visible.
 * Children remain visible during the delay and return after the minimum hold.
 * Tag variants keep their wrapper mounted and forward host props and refs.
 * @param {DelayedFallbackProps} props - Pending content options.
 * @param {boolean} props.pending - Whether work is pending.
 * @param {number} [props.delay] - Milliseconds before reveal; defaults to 200.
 * @param {number} [props.minDuration] - Minimum visible milliseconds; defaults to 300.
 * @param {React.ReactNode} [props.children] - Content shown outside the pending interval.
 * @param {React.ReactNode} [props.fallback] - Pending content; defaults to null.
 * @returns {React.ReactNode} The pending fallback or children.
 * @example
 * ```tsx
 * <DelayedFallback pending={saving} fallback={<Spinner />}>Saved</DelayedFallback>
 * ```
 */
export const DelayedFallback: DelayedFallbackType = createProxy(
  BaseDelayedFallback,
  renderForTag,
  "delayedFallback",
);
