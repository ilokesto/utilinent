import { useEffect, useRef, type RefObject } from "react";

type AnyEvent = MouseEvent | TouchEvent | PointerEvent;

/**
 * Options for {@link useClickAway}.
 */
interface UseClickAwayOptions {
  /** Additional refs whose contents are also considered "inside". */
  ignore?: React.RefObject<HTMLElement | null>[];
  /** Detect `pointerdown` instead of `mousedown`/`touchstart`. */
  pointerEvents?: boolean;
}

/**
 * @description Invokes the latest handler for pointer/touch events outside the
 * target and ignored refs. Listeners are removed on cleanup.
 *
 * SSR-safe: effects do not run on the server.
 *
 * @param {RefObject<HTMLElement | null>} ref - Target considered inside.
 * @param {(event: AnyEvent) => void} handler - Receives outside events.
 * @param {UseClickAwayOptions} [options] - Detection settings.
 * @param {React.RefObject<HTMLElement | null>[]} [options.ignore] - Additional inside targets.
 * @param {boolean} [options.pointerEvents] - Use pointerdown instead of mousedown/touchstart.
 * @returns {void} Registers effect-managed document listeners.
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useClickAway(ref, () => setOpen(false));
 * return <div ref={ref}>{children}</div>;
 * ```
 */
export function useClickAway(
  ref: RefObject<HTMLElement | null>,
  handler: (event: AnyEvent) => void,
  options: UseClickAwayOptions = {},
): void {
  const handlerRef = useRef(handler);
  const ignoreRef = useRef(options.ignore);

  useEffect(() => {
    handlerRef.current = handler;
    ignoreRef.current = options.ignore;
  });

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const events = options.pointerEvents
      ? (["pointerdown"] as const)
      : (["mousedown", "touchstart"] as const);

    const listener = ((event: Event) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      const ignored = ignoreRef.current ?? [];
      if (ignored.some((node) => node.current?.contains(event.target as Node))) {
        return;
      }

      handlerRef.current(event as AnyEvent);
    }) as EventListener;

    events.forEach((eventName) => {
      document.addEventListener(eventName, listener, { passive: true });
    });

    return () => {
      events.forEach((eventName) => {
        document.removeEventListener(eventName, listener);
      });
    };
  }, [ref, options.pointerEvents]);
}
