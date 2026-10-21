import { useEffect, useRef, useState } from "react";

/**
 * Options for {@link useEventListener}.
 */
interface UseEventListenerOptions<E extends Event = Event> {
  /** Capture phase listener. */
  capture?: boolean;
  /** Passive listener. */
  passive?: boolean;
  /** When `true`, the listener is attached but never invoked. */
  disabled?: boolean;
  /** Optional event filter / transform invoked before the handler. */
  predicate?: (event: E) => boolean;
}

type EventTargetLike = EventTarget | React.RefObject<EventTarget | null> | null;

/**
 * Attaches an event listener to a window/document/element target, or a ref.
 *
 * The handler is kept in a ref so listeners update without re-binding. When
 * the target is a `RefObject`, the hook tracks the DOM node it references:
 * nodes that mount later or get swapped re-bind the listener to the actual
 * node and detach it from the previous one.
 * SSR-safe: effects do not run on the server.
 *
 * @example
 * ```tsx
 * useEventListener(window, 'resize', () => console.log('resized'));
 * const ref = useRef<HTMLDivElement>(null);
 * useEventListener(ref, 'click', (e) => console.log(e.currentTarget));
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
