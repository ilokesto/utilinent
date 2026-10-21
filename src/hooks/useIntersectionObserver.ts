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
 * Tracks whether an element is intersecting the viewport via `IntersectionObserver`.
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
