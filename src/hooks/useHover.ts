import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useEventListener } from "./useEventListener";

/**
 * Return value of {@link useHover}.
 */
interface UseHoverResult {
  ref: (node: HTMLElement | null) => void;
  isHovering: boolean;
}

/**
 * @description Tracks mouse enter/leave events on an attached element.
 *
 * Returns a `ref` callback to attach to the target and the current
 * `isHovering` state. Detaching or replacing the target resets hover to false;
 * passing the same target again preserves the current state.
 *
 * @returns {UseHoverResult} Initially false hover state and target attachment.
 * - ref `(node: HTMLElement | null) => void` - Stable callback ref for the target.
 * - isHovering `boolean` - State updated by mouse enter/leave events.
 *
 * @example
 * ```tsx
 * const { ref, isHovering } = useHover();
 * return <div ref={ref}>{isHovering ? 'Hovering' : 'Idle'}</div>;
 * ```
 */
export function useHover(): UseHoverResult {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    if (elementRef.current === node) return;
    elementRef.current = node;
    setIsHovering(false);
    setElement(node);
  }, []);

  useEventListener(element, "mouseenter", () => setIsHovering(true));
  useEventListener(element, "mouseleave", () => setIsHovering(false));

  return { ref, isHovering };
}

/**
 * @description Tracks mouse enter/leave events on a ref, following its current
 * target after commits and removing old listeners on cleanup. Target changes
 * reset hover to false; unchanged targets preserve their hover state.
 *
 * @param {RefObject<HTMLElement | null>} ref - Ref containing the hover target.
 * @returns {boolean} Initially false; updated by mouse enter/leave events.
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * const isHovering = useHoverRef(ref);
 * ```
 */
export function useHoverRef(ref: RefObject<HTMLElement | null>): boolean {
  const [isHovering, setIsHovering] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (elementRef.current === ref.current) return;
    elementRef.current = ref.current;
    setIsHovering(false);
  });

  useEventListener(ref, "mouseenter", () => setIsHovering(true));
  useEventListener(ref, "mouseleave", () => setIsHovering(false));

  return isHovering;
}
