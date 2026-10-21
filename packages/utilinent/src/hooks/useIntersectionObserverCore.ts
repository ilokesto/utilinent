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
 * Shared implementation behind `useIntersectionObserver` and `Observer`.
 *
 * `trackEntry` selects the subscription mode:
 * - `true` (public hook): every delivered record updates `entry`, so entry
 *   consumers keep receiving ratio/coordinate updates even when the boolean
 *   does not change.
 * - `false` (boolean-only): `entry` stays `undefined` and same-boolean
 *   records never trigger a commit.
 *
 * Observation logic lives here once; the two public surfaces only pick a
 * mode.
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
   * Freeze is scoped to the observation of one target element: a frozen
   * state must never leak to a different or reattached target (#145).
   */
  const frozenTarget = useRef<HTMLElement | null>(null);
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

  // Reset the frozen lifetime when the target ends or freezing is turned
  // off. Declared before the subscription effect so it runs first when both
  // re-run in the same commit.
  useEffect(() => {
    if (!element || !freezeOnceVisible) {
      isFrozen.current = false;
      frozenTarget.current = null;
    }
    if (!element) {
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

    if (isFrozen.current && frozenTarget.current !== element) {
      // The frozen state belonged to a previous target observation; a new
      // target starts a fresh observation lifetime.
      isFrozen.current = false;
      frozenTarget.current = null;
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
          frozenTarget.current = element;
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
