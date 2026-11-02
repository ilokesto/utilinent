import { useMemo, useRef } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

export interface DebouncedCallbackOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface DebouncedCallback<Args extends unknown[], Result> {
  (...args: Args): void;
  /**
   * @description Discards pending arguments and ends the debounce window.
   * @example
   * saveDraft.cancel();
   * @returns {void} No value.
   */
  cancel(): void;
  /**
   * @description Immediately invokes pending trailing work and ends the window.
   * Returns the last callback result when there is no pending work.
   * @example
   * const savedDraft = saveDraft.flush();
   * @returns {Result | undefined} The last callback result, or undefined before any invocation.
   */
  flush(): Result | undefined;
}

/**
 * @description Returns a stable callable that debounces the latest committed
 * callback. Calls return void and retain the latest arguments until wait
 * milliseconds of silence. Defaults to trailing-only execution. With both edges
 * enabled, a single call runs only on the leading edge. Both edges disabled
 * suppress execution. Changing wait or either edge, or unmounting, cancels
 * pending work. Callback-only renders preserve pending work and callable identity.
 * @example
 * ```tsx
 * const saveDraft = useDebouncedCallback((text: string) => save(text), 300);
 * return <input onChange={(event) => saveDraft(event.target.value)} />;
 * ```
 * @param {(...args: Args) => Result} callback - Latest callback to invoke.
 * @param {number} wait - Debounce delay in milliseconds, clamped to zero when negative.
 * @param {DebouncedCallbackOptions} [options] - Execution edges.
 * @param {boolean} [options.leading=false] - Invoke at the start of a quiet window.
 * @param {boolean} [options.trailing=true] - Invoke with the latest pending arguments after silence.
 * @returns {DebouncedCallback<Args, Result>} Stable callable returning void.
 * - cancel `() => void` - Discard pending work and reset the window, retaining the last result.
 * - flush `() => Result | undefined` - Run pending trailing work now and return the last result.
 */
export function useDebouncedCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
  wait: number,
  options: DebouncedCallbackOptions = {},
): DebouncedCallback<Args, Result> {
  const leading = options.leading ?? false;
  const trailing = options.trailing ?? true;
  const callbackRef = useRef(callback);
  const optionsRef = useRef({ wait, leading, trailing });

  const debounced = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pendingArgs: Args | undefined;
    let lastResult: Result | undefined;

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
      clearTimeout(timer);
      timer = undefined;
      return invoke();
    };
    const scheduled = (...args: Args): void => {
      const config = optionsRef.current;
      if (!config.leading && !config.trailing) {
        return;
      }
      const invokeLeading = config.leading && timer === undefined;
      pendingArgs = config.trailing || invokeLeading ? args : undefined;
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        invoke();
      }, Math.max(0, config.wait));
      if (invokeLeading) {
        invoke();
      }
    };
    return Object.assign(scheduled, { cancel, flush });
  }, []);

  useIsomorphicLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useIsomorphicLayoutEffect(() => {
    optionsRef.current = { wait, leading, trailing };
    return debounced.cancel;
  }, [debounced, wait, leading, trailing]);

  return debounced;
}
