import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  normalizeThreshold,
  subscribeIntersection,
} from "./intersectionObserverPool";

/**
 * Options accepted by {@link useIntersectionObserverCore}. Mirrors the public
 * `UseIntersectionObserverOptions` contract without the deprecated alias.
 */
export interface UseIntersectionObserverCoreOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
  initialIsIntersecting?: boolean;
  /**
   * Called when the element transitions from non-intersecting to intersecting.
   */
  onIntersect?: (
    isIntersecting: boolean,
    entry: IntersectionObserverEntry
  ) => void;
}

/**
 * Return value shared by {@link useIntersectionObserverCore} and the public
 * {@link useIntersectionObserver}.
 */
export interface UseIntersectionObserverResult {
  ref: (node: HTMLElement | null) => void;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | undefined;
}

/**
 * @description Shared implementation behind `useIntersectionObserver` and `Observer`.
 *
 * `trackEntry` selects the subscription mode:
 * -- `true` (public hook): every delivered record updates `entry`, so entry
 *   consumers keep receiving ratio/coordinate updates even when the boolean
 *   does not change.
 * -- `false` (boolean-only): `entry` stays `undefined` and same-boolean
 *   records never trigger a commit.
 *
 * Observation logic lives here once; the two public surfaces only pick a
 * mode.
 * Equal observation settings share an observer. Cleanup releases the subscription;
 * freezing is target-scoped. Without the native API the initial state is retained.
 *
 * @param {UseIntersectionObserverCoreOptions} [options] - Shared observation settings.
 * @param {number | number[]} [options.threshold] - Visibility ratios; defaults to zero.
 * @param {Element | null} [options.root] - Root element; defaults to the viewport.
 * @param {string} [options.rootMargin] - Root margin; defaults to "0%".
 * @param {boolean} [options.freezeOnceVisible] - Freeze the current target after visibility; defaults to false.
 * @param {boolean} [options.initialIsIntersecting] - Initial and fallback state; defaults to false.
 * @param {(isIntersecting: boolean, entry: IntersectionObserverEntry) => void} [options.onIntersect] - Latest callback for transitions into visibility.
 * @param {boolean} trackEntry - Whether each native entry should update returned entry state.
 * @returns {UseIntersectionObserverResult} Target attachment and observation state.
 * - ref `(node: HTMLElement | null) => void` - Stable callback ref for the target.
 * - isIntersecting `boolean` - Whether intersection meets a configured threshold.
 * - entry `IntersectionObserverEntry | undefined` - Latest entry when tracked, otherwise undefined.
 * @example
 * ```tsx
 * const { ref, isIntersecting } = useIntersectionObserverCore({ threshold: 0.5 }, false);
 * return <section ref={ref} data-visible={isIntersecting} />;
 * ```
 */
export function useIntersectionObserverCore(
  options: UseIntersectionObserverCoreOptions = {},
  trackEntry: boolean
): UseIntersectionObserverResult {
  const {
    threshold = 0,
    root = null,
    rootMargin = "0%",
    freezeOnceVisible = false,
    initialIsIntersecting = false,
    onIntersect,
  } = options;

  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);
  const [entry, setEntry] = useState<IntersectionObserverEntry | undefined>();

  const onIntersectRef = useRef(onIntersect);
  const isFrozen = useRef(false);
  /**
   * Snapshot and freeze state belong to one target observation, including when
   * React replaces a node without committing an intermediate null target.
   */
  const observedTarget = useRef<HTMLElement | null>(null);
  const prevIsIntersecting = useRef(initialIsIntersecting);

  // Keep callback ref updated without resubscribing.
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  // Only the normalized values, not the caller's array identity, define a subscription.
  const thresholdKey = normalizeThreshold(threshold).join(",");

  const ref = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  // Start a fresh target lifetime before subscribing. Option changes on the
  // same target preserve its snapshot and only disabling freeze releases it.
  useEffect(() => {
    const targetChanged = observedTarget.current !== element;
    observedTarget.current = element;
    if (targetChanged || !element || !freezeOnceVisible) {
      isFrozen.current = false;
    }
    if (targetChanged || !element) {
      setIsIntersecting(initialIsIntersecting);
      setEntry(undefined);
      prevIsIntersecting.current = initialIsIntersecting;
    }
  }, [element, freezeOnceVisible, initialIsIntersecting]);

  // Main subscription effect. Dependencies intentionally use the derived
  // `thresholdKey` instead of `normalizedThreshold`: equal value sets keep
  // the subscription while real value changes replace it.
  useEffect(() => {
    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    if (isFrozen.current) {
      return;
    }

    const normalizedThreshold = thresholdKey.split(",").map(Number);
    const unsubscribe = subscribeIntersection(
      element,
      { root, rootMargin, threshold: normalizedThreshold },
      (intersectionEntry) => {
        const isCurrentlyIntersecting =
          intersectionEntry.isIntersecting &&
          normalizedThreshold.some(
            (t) => intersectionEntry.intersectionRatio >= t
          );

        const wasIntersecting = prevIsIntersecting.current;
        prevIsIntersecting.current = isCurrentlyIntersecting;

        setIsIntersecting(isCurrentlyIntersecting);
        if (trackEntry) {
          setEntry(intersectionEntry);
        }

        if (!wasIntersecting && isCurrentlyIntersecting) {
          onIntersectRef.current?.(isCurrentlyIntersecting, intersectionEntry);
        }

        if (freezeOnceVisible && isCurrentlyIntersecting) {
          isFrozen.current = true;
          // Target-scoped stop: releases only this target from the shared
          // observer without disturbing other subscribers (#141).
          unsubscribe();
        }
      }
    );

    return unsubscribe;
  }, [element, root, rootMargin, thresholdKey, freezeOnceVisible, trackEntry]);

  return useMemo(
    () => ({ ref, isIntersecting, entry }),
    [ref, isIntersecting, entry]
  );
}
