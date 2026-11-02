import { useCallback, useEffect, useState } from "react";

interface UseFocusWithinResult {
  ref: (node: HTMLElement | null) => void;
  isFocusWithin: boolean;
}

/**
 * @description Tracks focus on an element or any of its DOM descendants.
 *
 * The initial server and client value is `false`. After attachment, the hook
 * also checks for an already-focused descendant. Use CSS `:focus-within` when
 * only styling needs to change.
 *
 * @returns {UseFocusWithinResult} Focus state and target attachment.
 * - ref `(node: HTMLElement | null) => void` - Stable callback ref for the container.
 * - isFocusWithin `boolean` - Whether the container or a descendant has focus.
 * @example
 * ```tsx
 * const { ref, isFocusWithin } = useFocusWithin();
 * return <div ref={ref} data-focused={isFocusWithin}><input /></div>;
 * ```
 */
export function useFocusWithin(): UseFocusWithinResult {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isFocusWithin, setIsFocusWithin] = useState(false);

  // A stable callback keeps React from detaching the ref on ordinary renders.
  const ref = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    let focused = element?.contains(element.ownerDocument.activeElement) ?? false;
    setIsFocusWithin(focused);

    if (!element) {
      return;
    }

    const updateFocus = (next: boolean) => {
      if (focused !== next) {
        focused = next;
        setIsFocusWithin(next);
      }
    };
    const handleFocusIn = () => updateFocus(true);
    const handleFocusOut = (event: FocusEvent) => {
      const Node = element.ownerDocument.defaultView?.Node;
      updateFocus(
        Node !== undefined &&
          event.relatedTarget instanceof Node &&
          element.contains(event.relatedTarget),
      );
    };

    element.addEventListener("focusin", handleFocusIn);
    element.addEventListener("focusout", handleFocusOut);
    return () => {
      element.removeEventListener("focusin", handleFocusIn);
      element.removeEventListener("focusout", handleFocusOut);
    };
  }, [element]);

  return { ref, isFocusWithin };
}
