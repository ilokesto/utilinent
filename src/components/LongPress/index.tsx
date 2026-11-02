import { createElement, forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import type { ElementType, HTMLAttributes } from "react";
import { createProxy } from "../../core/createProxy";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect";
import { composeRefs } from "../../utils/composeRefs";
import type { LongPressProps, LongPressType } from "./types";

function renderForTag(tag: ElementType) {
  return forwardRef<HTMLElement, LongPressProps & Omit<HTMLAttributes<HTMLElement>, keyof LongPressProps>>(
    function LongPress(
      { duration = 500, movementThreshold = 10, onLongPress, onLongPressEnd,
        disabled = false, onPointerDown, onClick, children, ...props },
      forwardedRef,
    ) {
      const latest = useRef({ disabled, onLongPress, onLongPressEnd, movementThreshold });
      const target = useRef<HTMLElement | null>(null);
      const finish = useRef<(() => void) | null>(null);
      const suppressClick = useRef(false);
      const attach = useCallback((node: HTMLElement | null) => {
        if (target.current !== node) {
          finish.current?.();
          suppressClick.current = false;
          target.current = node;
        }
      }, []);
      const ref = useMemo(() => composeRefs(attach, forwardedRef), [attach, forwardedRef]);

      useIsomorphicLayoutEffect(() => {
        latest.current = { disabled, onLongPress, onLongPressEnd, movementThreshold };
        if (disabled) {
          finish.current?.();
        }
      }, [disabled, onLongPress, onLongPressEnd, movementThreshold]);
      useEffect(() => () => finish.current?.(), []);

      return createElement(tag, {
        ...(tag === "button" ? { type: "button" } : {}),
        ...props,
        // Native form controls retain their browser disabled behavior.
        ...(["button", "input", "select", "textarea", "fieldset", "option", "optgroup"].includes(
          typeof tag === "string" ? tag : "",
        ) ? { disabled } : { "aria-disabled": disabled || undefined }),
        ref,
        onPointerDown(event: React.PointerEvent<HTMLElement>) {
          onPointerDown?.(event);
          if (event.defaultPrevented || latest.current.disabled ||
            event.button !== 0 || event.isPrimary === false || finish.current) {
            return;
          }

          const node = target.current;
          if (!node) {
            return;
          }
          suppressClick.current = false;
          const start = event.nativeEvent;
          const document = node.ownerDocument;
          let activated = false;
          const end = () => {
            clearTimeout(timer);
            document.removeEventListener("pointermove", move, true);
            document.removeEventListener("pointerup", release, true);
            document.removeEventListener("pointercancel", release, true);
            finish.current = null;
            if (activated) {
              latest.current.onLongPressEnd?.();
            }
          };
          const move = (next: PointerEvent) => {
            if (next.pointerId === start.pointerId &&
              Math.hypot(next.clientX - start.clientX, next.clientY - start.clientY) >
                latest.current.movementThreshold) {
              end();
            }
          };
          const release = (next: PointerEvent) => {
            if (next.pointerId === start.pointerId) {
              end();
            }
          };
          const timer = setTimeout(() => {
            if (latest.current.disabled) {
              end();
              return;
            }
            activated = true;
            suppressClick.current = true;
            latest.current.onLongPress?.(start);
          }, duration);
          finish.current = end;
          document.addEventListener("pointermove", move, true);
          document.addEventListener("pointerup", release, true);
          document.addEventListener("pointercancel", release, true);
        },
        onClick(event: React.MouseEvent<HTMLElement>) {
          if (latest.current.disabled || (event.detail !== 0 && suppressClick.current)) {
            suppressClick.current = false;
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onClick?.(event);
        },
      }, children);
    },
  );
}

/**
 * @description Recognizes continuous primary-pointer presses on a button or a typed tag variant.
 * Movement beyond the threshold, release anywhere in the owner document, pointer cancellation,
 * disabling, node replacement, and unmount end the gesture. Only activated gestures call
 * onLongPressEnd. The pointer click following a long press is suppressed; keyboard clicks
 * remain immediate. Native pointer handlers and forwarded refs are preserved.
 * @example
 * ```tsx
 * <LongPress duration={600} onLongPress={() => openActions()} onClick={() => openItem()}>
 *   Open item
 * </LongPress>
 * ```
 * @param {LongPressProps & React.ComponentPropsWithRef<"button">} props - Gesture options and native element props.
 * @param {number} [props.duration=500] - Continuous press duration in milliseconds, sampled at pointerdown.
 * @param {number} [props.movementThreshold=10] - Maximum movement from the starting point in CSS pixels.
 * @param {(event: PointerEvent) => void} [props.onLongPress] - Receives the original native pointerdown event at activation.
 * @param {() => void} [props.onLongPressEnd] - Runs once when an activated gesture ends or is cancelled.
 * @param {boolean} [props.disabled=false] - Disables gestures and regular clicks.
 * @param {React.MouseEventHandler} [props.onClick] - Handles short pointer clicks and immediate keyboard activation.
 * @param {React.ReactNode} [props.children] - Content rendered inside the target element.
 * @param {React.Ref<HTMLElement>} [props.ref] - Ref forwarded to the selected element.
 * @returns {React.ReactNode} The target element with composed gesture handlers and the supplied children.
 */
export const LongPress: LongPressType = createProxy(
  renderForTag("button"), renderForTag, "longPress",
);

export type { LongPressProps, LongPressType } from "./types";
