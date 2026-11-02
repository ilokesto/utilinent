import { useCallback, useEffect, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect";
import { Observer } from "../Observer";
import type { SlackerProps } from "./types";

type LoadState<T> =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly error: Error; readonly generation: number }
  | { readonly status: "success"; readonly data: T };

const IDLE_STATE = { status: "idle" } as const;

/**
 * @description Lazy-loads data via a `loader` function when the component enters the viewport.
 *
 * Manages loading, error, and success states with optional retry.
 * The loader may consume its `AbortSignal` argument to cancel in-flight work;
 * zero-argument loaders remain fully supported.
 * Shows `loadingFallback` while loading, `errorFallback` on error, and
 * invokes `children` with the resolved data on success.
 * Manual and automatic retries share the maxRetries budget. Replacing the
 * loader invalidates the prior attempt; once activated, the new loader runs immediately.
 * @param {SlackerProps<T>} props - Lazy loading and retry options.
 * @param {(loaded: T) => React.ReactNode} props.children - Successful-data renderer.
 * @param {React.ReactNode | ((props: SlackerFallbackProps) => React.ReactNode)} [props.errorFallback] - Failed-attempt content or renderer.
 * @param {React.ReactNode} [props.loadingFallback] - Pending-attempt content.
 * @param {number | number[]} [props.threshold] - Visibility threshold; defaults to 0.1.
 * @param {string} [props.rootMargin] - Viewport margin; defaults to "50px".
 * @param {(signal: AbortSignal) => Promise<T> | T} props.loader - Data factory receiving a cancellation signal.
 * @param {(error: Error) => void} [props.onError] - Normalized failure callback.
 * @param {number} [props.maxRetries] - Additional attempts allowed; defaults to zero.
 * @param {number} [props.retryDelay] - Automatic retry delay in milliseconds; defaults to 1000.
 * @returns {React.ReactElement} An Observer containing the current loading, error, or success content.
 *
 * @example
 * ```tsx
 * <Slacker
 *   loader={() => fetchUser(id).then(r => r.json())}
 *   loadingFallback={<Spinner />}
 *   errorFallback={({ retry }) => <button onClick={retry}>Retry</button>}
 *   maxRetries={2}
 * >
 *   {(user) => <Profile user={user} />}
 * </Slacker>
 * ```
 */
export function Slacker<T = any>({
  children,
  errorFallback,
  loadingFallback,
  loader,
  threshold = 0.1,
  rootMargin = "50px",
  onError,
  maxRetries = 0,
  retryDelay = 1000,
}: SlackerProps<T>) {
  const [loadState, setLoadState] = useState<LoadState<T>>(IDLE_STATE);
  const activeRef = useRef(false);
  const activatedRef = useRef(false);
  const completedRef = useRef(false);
  const generationRef = useRef(0);
  const inFlightRef = useRef(false);
  const retriesUsedRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptControllerRef = useRef<AbortController | null>(null);
  const loaderRef = useRef(loader);
  const onErrorRef = useRef(onError);
  const maxRetriesRef = useRef(maxRetries);
  const retryDelayRef = useRef(retryDelay);
  const runAttemptRef = useRef<(() => void) | null>(null);

  const abortAttempt = useCallback(() => {
    // Aborting releases a superseded attempt's signal (unmount, loader
    // replacement, or a StrictMode teardown); loaders that ignore it are
    // unaffected and settled attempts keep their signal inert.
    attemptControllerRef.current?.abort();
    attemptControllerRef.current = null;
  }, []);

  const invalidate = useCallback(() => {
    generationRef.current += 1;
    inFlightRef.current = false;
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const runAttempt = useCallback(() => {
    runAttemptRef.current?.();
  }, []);

  const retry = useCallback((generation: number) => {
    if (
      !activeRef.current ||
      !activatedRef.current ||
      completedRef.current ||
      generation !== generationRef.current ||
      inFlightRef.current ||
      retriesUsedRef.current >= maxRetriesRef.current
    ) {
      return;
    }

    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    retriesUsedRef.current += 1;
    runAttempt();
  }, [runAttempt]);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      abortAttempt();
      invalidate();
    };
  }, [abortAttempt, invalidate]);

  useEffect(() => {
    runAttemptRef.current = () => {
      if (!activeRef.current || completedRef.current || inFlightRef.current) {
        return;
      }

      const generation = generationRef.current;
      // Each attempt owns a fresh controller; a retry therefore aborts the
      // failed attempt's signal instead of reusing it.
      attemptControllerRef.current?.abort();
      const controller = new AbortController();
      attemptControllerRef.current = controller;
      inFlightRef.current = true;
      setLoadState({ status: "loading" });

      Promise.resolve()
        .then(() => loaderRef.current(controller.signal))
        .then((data) => {
          if (!activeRef.current || generation !== generationRef.current) {
            return;
          }

          retriesUsedRef.current = 0;
          completedRef.current = true;
          invalidate();
          setLoadState({ status: "success", data });
        })
        .catch((reason: unknown) => {
          if (!activeRef.current || generation !== generationRef.current) {
            return;
          }

          inFlightRef.current = false;
          const error = reason instanceof Error ? reason : new Error(String(reason));
          console.error("Slacker loader failed:", error);
          onErrorRef.current?.(error);
          setLoadState({ status: "error", error, generation });

          if (retriesUsedRef.current < maxRetriesRef.current) {
            const retryGeneration = generationRef.current;
            retryTimerRef.current = setTimeout(() => {
              retryTimerRef.current = null;
              if (activeRef.current && retryGeneration === generationRef.current) {
                retry(retryGeneration);
              }
            }, retryDelayRef.current);
          }
        });
    };

    return () => {
      runAttemptRef.current = null;
    };
  }, [invalidate, retry]);

  useIsomorphicLayoutEffect(() => {
    onErrorRef.current = onError;
    maxRetriesRef.current = maxRetries;
    retryDelayRef.current = retryDelay;
    if (loaderRef.current === loader) {
      return;
    }

    loaderRef.current = loader;
    abortAttempt();
    invalidate();
    completedRef.current = false;
    retriesUsedRef.current = 0;
    setLoadState(IDLE_STATE);
    if (activatedRef.current) {
      runAttempt();
    }
  }, [abortAttempt, invalidate, loader, maxRetries, onError, retryDelay, runAttempt]);

  const handleIntersect = useCallback(
    (isIntersecting: boolean) => {
      if (!isIntersecting || activatedRef.current) {
        return;
      }

      activatedRef.current = true;
      retriesUsedRef.current = 0;
      runAttempt();
    },
    [runAttempt],
  );

  let content: React.ReactNode = null;
  if (loadState.status === "success") {
    content = children(loadState.data);
  } else if (loadState.status === "error") {
    content =
      typeof errorFallback === "function"
        ? errorFallback({
            isLoading: false,
            error: loadState.error,
            retry: () => retry(loadState.generation),
          })
        : errorFallback;
  } else if (loadState.status === "loading") {
    content = loadingFallback;
  }

  return (
    <Observer
      threshold={threshold}
      rootMargin={rootMargin}
      triggerOnce={true}
      onIntersect={handleIntersect}
    >
      {content}
    </Observer>
  );
}
