import { useIntersectionObserverCore } from "./useIntersectionObserverCore";
import type {
  UseIntersectionObserverCoreOptions,
  UseIntersectionObserverResult,
} from "./useIntersectionObserverCore";

/**
 * Options for {@link useIntersectionObserver}.
 */
interface UseIntersectionObserverOptions extends UseIntersectionObserverCoreOptions {
  /**
   * @deprecated Use {@link UseIntersectionObserverOptions.onIntersect} instead.
   * Kept as a backward-compatible alias.
   */
  onChange?: (
    isIntersecting: boolean,
    entry: IntersectionObserverEntry
  ) => void;
}

/**
 * @description Tracks whether an element intersects the configured root via `IntersectionObserver`.
 *
 * Returns a `ref` callback to attach to the target element and the current
 * `isIntersecting` state. When `freezeOnceVisible` is `true`, observation stops
 * after the first intersection. Falls back to `initialIsIntersecting` when
 * `IntersectionObserver` is unavailable.
 *
 * `onIntersect` fires when the element transitions from non-intersecting to
 * intersecting. `onChange` is accepted as a deprecated alias.
 *
 * Subscriptions are value-stable: `threshold` arrays are normalized to their
 * value set, so a fresh-but-equal array identity never recreates the observer,
 * and equal `root`/`rootMargin`/threshold combinations share one native
 * observer that is released when the last subscriber unsubscribes.
 *
 * `freezeOnceVisible` freezes the observation of the current target only: when
 * the target element is removed, swapped or reattached, the new target is
 * observed again from scratch.
 *
 * @param {UseIntersectionObserverOptions} [options] - Shared observation settings.
 * @param {number | number[]} [options.threshold] - Visibility ratios; defaults to zero.
 * @param {Element | null} [options.root] - Root element; defaults to the viewport.
 * @param {string} [options.rootMargin] - Root margin; defaults to "0%".
 * @param {boolean} [options.freezeOnceVisible] - Stop this target after first visibility; defaults to false.
 * @param {boolean} [options.initialIsIntersecting] - Initial and unavailable-API fallback state; defaults to false.
 * @param {(isIntersecting: boolean, entry: IntersectionObserverEntry) => void} [options.onIntersect] - Called on transitions into visibility using the latest callback.
 * @param {(isIntersecting: boolean, entry: IntersectionObserverEntry) => void} [options.onChange] - Deprecated fallback alias when onIntersect is absent.
 * @returns {UseIntersectionObserverResult} Target attachment and current observation.
 * - ref `(node: HTMLElement | null) => void` - Stable callback ref for the observed target.
 * - isIntersecting `boolean` - Whether the target intersects and meets a threshold.
 * - entry `IntersectionObserverEntry | undefined` - Latest delivered native entry, absent before delivery.
 *
 * @example
 * ```tsx
 * const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });
 * return <div ref={ref}>{isIntersecting ? 'Visible' : 'Hidden'}</div>;
 * ```
 */
export function useIntersectionObserver({
  onIntersect,
  onChange,
  ...options
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverResult {
  // `onChange` is a deprecated alias for `onIntersect`.
  return useIntersectionObserverCore(
    { ...options, onIntersect: onIntersect ?? onChange },
    true
  );
}
