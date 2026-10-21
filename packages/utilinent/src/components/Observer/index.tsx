import { forwardRef, useMemo } from "react";
import type { ComponentPropsWithRef } from "react";
import { useIntersectionObserverCore } from "../../hooks/useIntersectionObserverCore";
import { Show } from "../Show";
import { composeRefs } from "../../utils/composeRefs";
import type { ObserverProps } from "./types";

/**
 * Wraps children in an IntersectionObserver-driven container.
 *
 * Renders `fallback` until the element intersects the viewport, then renders children.
 * Supports a render-prop callback that receives the current `isIntersecting` boolean.
 * Forwards `ref` to the underlying `div`.
 *
 * Subscribes to the intersection boolean only: records that keep the boolean
 * unchanged do not re-render Observer, while `useIntersectionObserver`
 * remains the escape hatch for per-entry detail.
 *
 * @example
 * ```tsx
 * <Observer fallback={<Placeholder />} rootMargin="100px">
 *   {(isIntersecting) => isIntersecting ? <Content /> : <Spinner />}
 * </Observer>
 * ```
 */
export const Observer = forwardRef<HTMLDivElement, ObserverProps & Omit<ComponentPropsWithRef<'div'>, 'ref' | 'children'>>(
  function Observer(
    {
      children,
      fallback = null,
      threshold = 0,
      rootMargin = "0%",
      triggerOnce: freezeOnceVisible = false,
      onIntersect: onChange,
      keepMeasurable = false,
      style,
      ...props
    },
    forwardedRef
  ) {
    // Boolean-only subscription (#140): Observer renders the intersection
    // boolean and never consumes entry details, so same-boolean records must
    // not commit. Entry detail stays available through useIntersectionObserver.
    const { ref: observerRef, isIntersecting } = useIntersectionObserverCore(
      {
        threshold,
        rootMargin,
        freezeOnceVisible,
        onIntersect: onChange,
      },
      false
    );

    const mergedRef = useMemo(
      () => composeRefs(observerRef, forwardedRef),
      [observerRef, forwardedRef]
    );

    return (
      <Show.div
        ref={mergedRef}
        when={isIntersecting}
        fallback={fallback}
        style={
          keepMeasurable
            ? {
                ...style,
                minHeight: style?.minHeight ?? "1px",
                minWidth: style?.minWidth ?? "1px",
                display: style?.display ?? "block",
              }
            : style
        }
        {...props}
      >
        {typeof children === "function" ? children(isIntersecting) : children}
      </Show.div>
    );
  }
);
