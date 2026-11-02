import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeThreshold, subscribeIntersection } from "./intersectionObserverPool";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

export interface UseInfiniteSentinelOptions {
  onLoadMore: () => void | Promise<unknown>;
  hasMore: boolean;
  busy?: boolean;
  disabled?: boolean;
  onError?: (error: unknown) => void;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export interface UseInfiniteSentinelResult {
  ref: (node: HTMLElement | null) => void;
  isIntersecting: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
}

/**
 * @description Loads once per entry or controlled busy-to-idle cycle. Promise settlement
 * releases the in-flight lock but does not itself request another page.
 * Uses committed callbacks and suppresses completion callbacks after unmount;
 * consumer-owned promises are not canceled. Errors stop automatic requests
 * until a new entry or retry. Without IntersectionObserver no automatic load starts.
 *
 * @param {UseInfiniteSentinelOptions} options - Loading and observation settings.
 * @param {() => void | Promise<unknown>} options.onLoadMore - Starts loading the next page.
 * @param {boolean} options.hasMore - Whether more pages may be requested.
 * @param {boolean} [options.busy] - External loading lock; defaults to false.
 * @param {boolean} [options.disabled] - Pause requests; defaults to false.
 * @param {(error: unknown) => void} [options.onError] - Receives a load failure while mounted with a target.
 * @param {Element | null} [options.root] - Intersection root; defaults to the viewport.
 * @param {string} [options.rootMargin] - Root margin; defaults to "0%".
 * @param {number | number[]} [options.threshold] - Visibility ratios; defaults to zero.
 * @returns {UseInfiniteSentinelResult} Sentinel attachment, load state, and retry control.
 * - ref `(node: HTMLElement | null) => void` - Stable callback ref for the sentinel.
 * - isIntersecting `boolean` - Whether the target meets a configured visibility threshold.
 * - isLoading `boolean` - External busy state or an unsettled load.
 * - isError `boolean` - Whether the most recent request failed.
 * - error `unknown` - Failure reason, cleared when another request begins.
 * - retry `() => void` - Request manually even outside visibility; still respects target, busy, disabled, hasMore, and in-flight guards.
 * @example
 * ```tsx
 * const { ref, isLoading, isError, retry } = useInfiniteSentinel({
 *   onLoadMore: fetchNextPage,
 *   hasMore: hasNextPage,
 * });
 * return <div ref={ref}>{isError
 *   ? <button onClick={retry}>Retry</button>
 *   : isLoading ? 'Loading...' : 'More results'}</div>;
 * ```
 */
export function useInfiniteSentinel({
  onLoadMore, hasMore, busy = false, disabled = false, onError,
  root = null, rootMargin = "0%", threshold = 0,
}: UseInfiniteSentinelOptions): UseInfiniteSentinelResult {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [pending, setPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<unknown>();
  const latest = useRef({ onLoadMore, hasMore, busy, disabled, onError });
  const target = useRef<HTMLElement | null>(null);
  const mounted = useRef(false);
  const observation = useRef<{ visible: boolean; armed: boolean } | null>(null);
  const inFlight = useRef(false);
  const failed = useRef(false);
  const thresholdKey = normalizeThreshold(threshold).join(",");

  useIsomorphicLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // The stable subscription sees committed callbacks, never speculative renders.
  useIsomorphicLayoutEffect(() => {
    const previous = latest.current;
    latest.current = { onLoadMore, hasMore, busy, disabled, onError };
    if (observation.current && (
      (previous.busy && !busy) || (previous.disabled && !disabled) ||
      (!previous.hasMore && hasMore)
    )) {
      observation.current.armed = true;
    }
  }, [onLoadMore, hasMore, busy, disabled, onError]);

  const request = useCallback(function request(manual = false) {
    const current = observation.current;
    const options = latest.current;
    if (!mounted.current || !target.current || !current || inFlight.current || options.busy || options.disabled ||
      !options.hasMore || (!manual && (!current.visible || !current.armed || failed.current))) {
      return;
    }
    current.armed = false;
    inFlight.current = true;
    failed.current = false;
    setPending(true);
    setIsError(false);
    setError(undefined);

    const finish = (didFail: boolean, reason?: unknown) => {
      inFlight.current = false;
      // Unmount does not cancel consumer-owned work or deliver its callbacks.
      if (!mounted.current) {
        return;
      }
      setPending(false);
      if (!observation.current || !target.current) {
        return;
      }
      if (didFail) {
        failed.current = true;
        observation.current.armed = false;
        setIsError(true);
        setError(() => reason);
        latest.current.onError?.(reason);
      } else {
        request();
      }
    };
    let result: void | Promise<unknown>;
    try {
      result = options.onLoadMore();
    } catch (reason) {
      finish(true, reason);
      return;
    }
    Promise.resolve(result).then(
      () => finish(false),
      (reason: unknown) => finish(true, reason),
    );
  }, []);

  const ref = useCallback((node: HTMLElement | null) => {
    target.current = node;
    setElement(node);
  }, []);
  const retry = useCallback(() => request(true), [request]);

  useEffect(() => {
    if (!element) {
      setIsIntersecting(false);
      return;
    }
    const current = { visible: false, armed: true };
    observation.current = current;
    setPending(inFlight.current);
    const thresholds = thresholdKey.split(",").map(Number);
    const unsubscribe = subscribeIntersection(
      element, { root, rootMargin, threshold: thresholds }, (entry) => {
        if (observation.current !== current || target.current !== element) {
          return;
        }
        const visible = entry.isIntersecting &&
          thresholds.some((value) => entry.intersectionRatio >= value);
        if (visible && !current.visible) {
          current.armed = true;
          failed.current = false;
        }
        current.visible = visible;
        setIsIntersecting(visible);
        request();
      },
    );
    setIsIntersecting(false);
    return () => {
      observation.current = null;
      unsubscribe();
    };
  }, [element, root, rootMargin, thresholdKey, request]);

  useEffect(() => {
    request();
  }, [busy, disabled, hasMore, request]);

  return { ref, isIntersecting, isLoading: busy || pending, isError, error, retry };
}
