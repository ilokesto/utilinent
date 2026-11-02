import { createElement, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ElementType, HTMLAttributes } from "react";
import { createProxy } from "../../core/createProxy";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect";
import { usePageVisibility } from "../../hooks/usePageVisibility";
import { composeRefs } from "../../utils/composeRefs";
import type { ImpressionProps, ImpressionType } from "./types";

function renderForTag(tag: ElementType) {
  return forwardRef<HTMLElement, ImpressionProps & Omit<HTMLAttributes<HTMLElement>, keyof ImpressionProps>>(
    function Impression(
      { ratio = 0.5, duration = 1000, root = null, rootMargin = "0%",
        onStart, onEnd, children, ...props },
      forwardedRef,
    ) {
      // An exit and re-entry may be delivered in one React batch. Track every
      // entering edge so that a final unchanged boolean cannot preserve exposure.
      const [exposure, setExposure] = useState(0);
      const { ref: observerRef, isIntersecting, entry } = useIntersectionObserver({
        threshold: ratio, root, rootMargin,
        onIntersect: () => setExposure((previous) => previous + 1),
      });
      const isPageVisible = usePageVisibility();
      useEffect(() => {
        // Preserve a hidden edge even if React batches hide and show together.
        const invalidateHiddenExposure = () => {
          if (document.visibilityState !== "visible") {
            setExposure((previous) => previous + 1);
          }
        };
        document.addEventListener("visibilitychange", invalidateHiddenExposure);
        return () => document.removeEventListener("visibilitychange", invalidateHiddenExposure);
      }, []);
      const [node, setNode] = useState<HTMLElement | null>(null);
      const [isActive, setIsActive] = useState(false);
      const callbacks = useRef({ onStart, onEnd });
      useIsomorphicLayoutEffect(() => {
        callbacks.current = { onStart, onEnd };
      }, [onStart, onEnd]);

      const targetRef = useCallback((target: HTMLElement | null) => {
        observerRef(target);
        setNode(target);
      }, [observerRef]);
      const mergedRef = useMemo(
        () => composeRefs(targetRef, forwardedRef), [targetRef, forwardedRef],
      );
      const observedTarget = entry?.target;
      const meetsRatio = isIntersecting && (entry?.intersectionRatio ?? 0) >= ratio;
      const [observation, setObservation] = useState({ node, root, rootMargin, ratio, staleEntry: entry });
      const sameConfiguration = observation.node === node && observation.root === root
        && observation.rootMargin === rootMargin && observation.ratio === ratio;
      useIsomorphicLayoutEffect(() => {
        if (!sameConfiguration) {
          // The observer retains its old entry while replacing a subscription.
          // Commit the boundary before passive qualification can reuse it.
          setObservation({ node, root, rootMargin, ratio, staleEntry: entry });
        }
      }, [sameConfiguration, node, root, rootMargin, ratio, entry]);
      const hasFreshObservation = sameConfiguration && entry !== observation.staleEntry;

      useEffect(() => {
        if (!hasFreshObservation
          || !node || observedTarget !== node || !meetsRatio || !isPageVisible) {
          return;
        }
        let started = false;
        const start = () => {
          started = true;
          setIsActive(true);
          callbacks.current.onStart?.();
        };
        const end = () => {
          if (started) {
            setIsActive(false);
            callbacks.current.onEnd?.();
          }
        };
        if (duration <= 0) {
          start();
          return end;
        }
        const timer = setTimeout(start, duration);
        return () => {
          clearTimeout(timer);
          end();
        };
      }, [node, observedTarget, meetsRatio, isPageVisible, exposure, ratio, duration, root, rootMargin, hasFreshObservation]);

      return createElement(
        tag, { ...props, ref: mergedRef },
        typeof children === "function" ? children(isActive) : children,
      );
    },
  );
}

/**
 * @description Tracks repeatable impressions after continuous qualified visibility.
 * Defaults to a div; typed tag variants preserve native props and forwarded refs.
 * Leaving the ratio, hiding the document, replacing the target, changing observation
 * options, or unmounting cancels pending work and ends any started exposure.
 * Requires IntersectionObserver; unsupported environments and SSR never start exposure.
 * @example
 * ```tsx
 * <Impression.article ratio={0.5} duration={1000} onStart={() => recordView("story")}>
 *   <Story />
 * </Impression.article>
 * ```
 * @param {ImpressionProps} props - Exposure options and native element props.
 * @param {number} [props.ratio=0.5] - Minimum intersection ratio between zero and one.
 * @param {number} [props.duration=1000] - Continuous visible time in milliseconds; zero starts immediately.
 * @param {Element | null} [props.root=null] - Intersection root; null uses the viewport.
 * @param {string} [props.rootMargin="0%"] - Margin around the intersection root.
 * @param {() => void} [props.onStart] - Latest callback invoked when an exposure qualifies.
 * @param {() => void} [props.onEnd] - Latest callback invoked once when a qualified exposure ends.
 * @param {ReactNode | ((isActive: boolean) => ReactNode)} [props.children] - Content or render function receiving qualified exposure state.
 * @param {Ref<HTMLElement>} [props.ref] - Ref forwarded to the selected DOM element.
 * @returns {ReactNode} The selected container and its children.
 */
export const Impression: ImpressionType = createProxy(
  renderForTag("div"), renderForTag, "impression",
);

export type { ImpressionProps, ImpressionType } from "./types";
