import { useCallback, useEffect, useMemo, useRef, useState } from "react";
export function useIntersectionObserver({ threshold = 0, root = null, rootMargin = "0%", freezeOnceVisible = false, initialIsIntersecting = false, onChange, } = {}) {
    const [element, setElement] = useState(null);
    const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);
    const [entry, setEntry] = useState();
    const onChangeRef = useRef(onChange);
    const isFirstCallbackRef = useRef(true);
    const isFrozen = useRef(false);
    const prevIsIntersectingRef = useRef(initialIsIntersecting);
    // Keep callback ref updated
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);
    // Memoize options
    const observerOptions = useMemo(() => ({ threshold, root, rootMargin }), [threshold, root, rootMargin]);
    // Ref callback to set the element
    const ref = useCallback((node) => {
        setElement(node);
    }, []);
    // Main intersection observer effect
    useEffect(() => {
        if (!element || !("IntersectionObserver" in window)) {
            return;
        }
        // If frozen (triggerOnce + already intersected), skip observation
        if (isFrozen.current) {
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            const [intersectionEntry] = entries;
            if (!intersectionEntry)
                return;
            const thresholds = Array.isArray(observer.thresholds)
                ? observer.thresholds
                : [observer.thresholds];
            const isCurrentlyIntersecting = intersectionEntry.isIntersecting &&
                thresholds.some((t) => intersectionEntry.intersectionRatio >= t);
            const wasIntersecting = prevIsIntersectingRef.current;
            prevIsIntersectingRef.current = isCurrentlyIntersecting;
            // Update state
            setIsIntersecting(isCurrentlyIntersecting);
            setEntry(intersectionEntry);
            // Skip the first callback (initial observation)
            if (isFirstCallbackRef.current) {
                isFirstCallbackRef.current = false;
                return;
            }
            // Call onChange callback
            if (!wasIntersecting && isCurrentlyIntersecting) {
                onChangeRef.current?.(isCurrentlyIntersecting, intersectionEntry);
            }
            // Freeze if triggerOnce and now intersecting
            if (freezeOnceVisible && isCurrentlyIntersecting) {
                isFrozen.current = true;
                // Immediately disconnect to stop further observations
                observer.disconnect();
            }
        }, observerOptions);
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, [element, observerOptions, freezeOnceVisible]);
    // Reset when element is removed
    useEffect(() => {
        if (!element) {
            setIsIntersecting(initialIsIntersecting);
            setEntry(undefined);
            isFirstCallbackRef.current = true;
            prevIsIntersectingRef.current = initialIsIntersecting;
            if (!freezeOnceVisible) {
                isFrozen.current = false;
            }
        }
    }, [element, freezeOnceVisible, initialIsIntersecting]);
    return useMemo(() => ({ ref, isIntersecting, entry }), [ref, isIntersecting, entry]);
}
