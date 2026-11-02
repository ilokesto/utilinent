import { useMemo, useRef } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

export interface ThrottledCallbackOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface ThrottledCallback<Args extends unknown[], Result> {
  (...args: Args): void;
  /**
   * @description Discards pending arguments and resets the throttle window.
   * @example
   * trackPosition.cancel();
   * @returns {void} No value.
   */
  cancel(): void;
  /**
   * @description Immediately invokes pending trailing work, starting a fresh
   * cooldown. Returns the last callback result when there is no pending work.
   * @example
   * const position = trackPosition.flush();
   * @returns {Result | undefined} The last callback result, or undefined before any invocation.
   */
  flush(): Result | undefined;
}

/**
 * @description Returns a stable callable that throttles the latest committed
 * callback to one invocation per wait milliseconds. Defaults to leading and
 * trailing execution; a single call does not also fire on the trailing edge.
 * Calls return void. Suppressed calls retain their latest arguments only when
 * trailing is enabled. Both edges disabled suppress execution. Changing wait or
 * either edge, or unmounting, cancels pending work. Callback-only renders preserve
 * pending work and callable identity. Flush may invoke early and starts a fresh
 * cooldown when it invokes pending work.
 * @example
 * ```tsx
 * const trackPosition = useThrottledCallback((x: number, y: number) => track(x, y), 100);
 * return <div onPointerMove={(event) => trackPosition(event.clientX, event.clientY)} />;
 * ```
 * @param {(...args: Args) => Result} callback - Latest callback to invoke.
 * @param {number} wait - Throttle interval in milliseconds, clamped to zero when negative.
 * @param {ThrottledCallbackOptions} [options] - Execution edges.
 * @param {boolean} [options.leading=true] - Invoke immediately when no window is active.
 * @param {boolean} [options.trailing=true] - Invoke the latest suppressed call at the window boundary.
 * @returns {ThrottledCallback<Args, Result>} Stable callable returning void.
 * - cancel `() => void` - Discard pending work and reset the window, retaining the last result.
 * - flush `() => Result | undefined` - Run pending trailing work now and return the last result.
 */
export function useThrottledCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
  wait: number,
  options: ThrottledCallbackOptions = {},
): ThrottledCallback<Args, Result> {
  const leading = options.leading ?? true;
  const trailing = options.trailing ?? true;
  const callbackRef = useRef(callback);
  const optionsRef = useRef({ wait, leading, trailing });

  const throttled = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pendingArgs: Args | undefined;
    let lastResult: Result | undefined;

    const startWindow = () => {
      timer = setTimeout(() => {
        timer = undefined;
        if (pendingArgs) {
          startWindow();
          invoke();
        }
      }, Math.max(0, optionsRef.current.wait));
    };
    const invoke = () => {
      const args = pendingArgs;
      pendingArgs = undefined;
      if (args) {
        lastResult = callbackRef.current(...args);
      }
      return lastResult;
    };
    const cancel = () => {
      clearTimeout(timer);
      timer = undefined;
      pendingArgs = undefined;
    };
    const flush = () => {
      if (pendingArgs) {
        clearTimeout(timer);
        startWindow();
        return invoke();
      }
      return lastResult;
    };
    const scheduled = (...args: Args): void => {
      const config = optionsRef.current;
      if (!config.leading && !config.trailing) {
        return;
      }
      if (timer === undefined) {
        pendingArgs = args;
        startWindow();
        if (config.leading) {
          invoke();
        }
      } else if (config.trailing) {
        pendingArgs = args;
      }
    };
    return Object.assign(scheduled, { cancel, flush });
  }, []);

  useIsomorphicLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useIsomorphicLayoutEffect(() => {
    optionsRef.current = { wait, leading, trailing };
    return throttled.cancel;
  }, [throttled, wait, leading, trailing]);

  return throttled;
}
