import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Options for {@link useResizeObserver}.
 */
interface UseResizeObserverOptions {
  /** Observer box model. Defaults to `content-box`. */
  box?: ResizeObserverBoxOptions;
  /** Initial size before the first observation fires. */
  initialSize?: DOMRectReadOnly;
}

/**
 * Return value of {@link useResizeObserver}.
 */
interface UseResizeObserverResult {
  ref: (node: HTMLElement | null) => void;
  width: number;
  height: number;
  entry: ResizeObserverEntry | undefined;
}

/**
 * @description Tracks an element's content rectangle via `ResizeObserver`.
 *
 * Returns a `ref` callback to attach to the target and the current
 * `width` / `height`. Without ResizeObserver, retains initialSize (or zeros).
 * Disconnects the observer on target/box changes and unmount.
 *
 * @param {UseResizeObserverOptions} [options] - Observation settings.
 * @param {ResizeObserverBoxOptions} [options.box] - Observed box; defaults to content-box.
 * @param {DOMRectReadOnly} [options.initialSize] - Size used until an observation arrives.
 * @returns {UseResizeObserverResult} Target attachment and latest measured size.
 * - ref `(node: HTMLElement | null) => void` - Stable callback ref for the element.
 * - width `number` - Content rectangle width, initial width, or zero.
 * - height `number` - Content rectangle height, initial height, or zero.
 * - entry `ResizeObserverEntry | undefined` - Latest native entry, absent before delivery.
 *
 * @example
 * ```tsx
 * const { ref, width, height } = useResizeObserver();
 * return <textarea ref={ref} style={{ width, height }} />;
 * ```
 */
export function useResizeObserver({
  box = "content-box",
  initialSize,
}: UseResizeObserverOptions = {}): UseResizeObserverResult {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState<DOMRectReadOnly | undefined>(initialSize);
  const [entry, setEntry] = useState<ResizeObserverEntry | undefined>();

  const ref = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const [resizeEntry] = entries;
      if (!resizeEntry) {
        return;
      }
      setEntry(resizeEntry);
      setSize(resizeEntry.contentRect);
    });

    observer.observe(element, { box });

    return () => {
      observer.disconnect();
    };
  }, [element, box]);

  return useMemo(
    () => ({
      ref,
      width: size?.width ?? 0,
      height: size?.height ?? 0,
      entry,
    }),
    [ref, size, entry],
  );
}
