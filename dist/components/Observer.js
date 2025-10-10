import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef, useCallback } from "react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import { Show } from "./Show";
export const Observer = forwardRef(function Observer({ children, fallback = null, threshold = 0, rootMargin = "0px", triggerOnce: freezeOnceVisible = false, onIntersect: onChange, style, ...props }, forwardedRef) {
    const { ref: observerRef, isIntersecting } = useIntersectionObserver({
        threshold,
        rootMargin,
        freezeOnceVisible,
        onChange,
    });
    const mergedRef = useCallback((node) => {
        // Set observer ref
        observerRef(node);
        // Handle forwarded ref
        if (typeof forwardedRef === "function") {
            forwardedRef(node);
        }
        else if (forwardedRef) {
            forwardedRef.current = node;
        }
    }, [observerRef, forwardedRef]);
    return (_jsx(Show.div, { ref: mergedRef, when: isIntersecting, fallback: fallback, style: {
            ...style,
            minHeight: style?.minHeight ?? "1px",
            minWidth: style?.minWidth ?? "1px",
            display: style?.display ?? "block",
        }, ...props, children: typeof children === "function" ? children(isIntersecting) : children }));
});
