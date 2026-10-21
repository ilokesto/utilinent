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
  error: unknown;
  retry: () => void;
}

/**
 * Loads once per entry or controlled busy-to-idle cycle. Promise settlement
 * releases the in-flight lock but does not itself request another page.
 */
export function useInfiniteSentinel({
  onLoadMore, hasMore, busy = false, disabled = false, onError,
  root = null, rootMargin = "0%", threshold = 0,
}: UseInfiniteSentinelOptions): UseInfiniteSentinelResult {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [pending, setPending] = useState(false);
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

  return { ref, isIntersecting, isLoading: busy || pending, error, retry };
}
