import { useEffect, useRef, useState } from "react";

/**
 * Options for {@link useEventListener}.
 */
interface UseEventListenerOptions<E extends Event = Event> {
  /** Capture phase listener. */
  capture?: boolean;
  /** Passive listener. */
  passive?: boolean;
  /** When `true`, the listener is not attached. */
  disabled?: boolean;
  /** Optional event filter / transform invoked before the handler. */
  predicate?: (event: E) => boolean;
}

type EventTargetLike = EventTarget | React.RefObject<EventTarget | null> | null;

/**
 * @description Attaches an event listener to an EventTarget or a ref.
 *
 * The handler is kept in a ref so listeners update without re-binding. When
 * the target is a `RefObject`, the hook tracks the DOM node it references:
 * nodes that mount later or get swapped re-bind the listener to the actual
 * node and detach it from the previous one.
 * SSR-safe: effects do not run on the server.
 *
 * @param {EventTargetLike} target - Target or ref; null attaches nothing.
 * @param {string} eventName - Native event name.
 * @param {(event: E) => void} handler - Latest handler for accepted events.
 * @param {UseEventListenerOptions<E>} [options] - Listener settings.
 * @param {boolean} [options.capture] - Listen during capture.
 * @param {boolean} [options.passive] - Declare that the listener will not prevent default.
 * @param {boolean} [options.disabled] - Skip attaching the listener while true.
 * @param {(event: E) => boolean} [options.predicate] - Accept an event before invoking the handler.
 * @returns {void} Removes the listener on target/settings changes or unmount.
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useEventListener<MouseEvent>(ref, 'click', () => setOpen(true));
 * return <div ref={ref}>Open details</div>;
 * ```
 */
export function useEventListener<E extends Event = Event>(
  target: EventTargetLike,
  eventName: string,
  handler: (event: E) => void,
  options: UseEventListenerOptions<E> = {},
): void {
  const handlerRef = useRef(handler);
  const predicateRef = useRef(options.predicate);
  const [observedTarget, setObservedTarget] = useState<EventTarget | null>(() =>
    resolveTarget(target),
  );

  useEffect(() => {
    handlerRef.current = handler;
    predicateRef.current = options.predicate;
  });

  // A RefObject keeps its identity while the node it references can mount,
  // swap, or clear after commit. Re-resolve after every commit and record
  // node changes so the subscription below follows the actual DOM node.
  useEffect(() => {
    setObservedTarget((previous) => {
      const next = resolveTarget(target);
      return previous === next ? previous : next;
    });
  });

  useEffect(() => {
    if (options.disabled) {
      return;
    }

    const node = observedTarget;
    if (!node) {
      return;
    }

    const listener = (event: Event) => {
      if (predicateRef.current && !predicateRef.current(event as E)) {
        return;
      }
      handlerRef.current(event as E);
    };

    node.addEventListener(eventName, listener, {
      capture: options.capture,
      passive: options.passive,
    });

    return () => {
      node.removeEventListener(eventName, listener, {
        capture: options.capture,
      });
    };
  }, [observedTarget, eventName, options.disabled, options.capture, options.passive]);
}

function resolveTarget(target: EventTargetLike): EventTarget | null {
  if (target == null) {
    return null;
  }
  if (typeof target === "object" && "current" in target) {
    return (target as React.RefObject<EventTarget | null>).current;
  }
  return target;
}
