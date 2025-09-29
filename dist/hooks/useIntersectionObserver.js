import { useCallback, useEffect, useMemo, useRef, useState } from "react";
export function useIntersectionObserver({ threshold = 0, root = null, rootMargin = "0%", freezeOnceVisible = false, initialIsIntersecting = false, onChange, } = {}) {
    const [element, setElement] = useState(null);
    const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);
    const [entry, setEntry] = useState();
    const observerRef = useRef(null);
    const changeCallbackRef = useRef(onChange);
    // Memoize options to prevent unnecessary observer recreation
    const observerOptions = useMemo(() => ({
        threshold,
        root,
        rootMargin,
    }), [threshold, root, rootMargin]);
    const isFrozen = freezeOnceVisible && isIntersecting;
    // Keep callback ref updated
    useEffect(() => {
        changeCallbackRef.current = onChange;
    }, [onChange]);
    // Ref callback to set the element
    const ref = useCallback((node) => {
        setElement(node);
    }, []);
    // Main intersection observer effect
    useEffect(() => {
        if (!element || !("IntersectionObserver" in window) || isFrozen) {
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
            setIsIntersecting(isCurrentlyIntersecting);
            setEntry(intersectionEntry);
            // Call onChange callback if provided
            changeCallbackRef.current?.(isCurrentlyIntersecting, intersectionEntry);
        }, observerOptions);
        observer.observe(element);
        observerRef.current = observer;
        return () => {
            observer.disconnect();
            observerRef.current = null;
        };
    }, [element, observerOptions, isFrozen]);
    // Reset state when element is removed and not frozen
    useEffect(() => {
        if (!element && !freezeOnceVisible && !isFrozen) {
            setIsIntersecting(initialIsIntersecting);
            setEntry(undefined);
        }
    }, [element, freezeOnceVisible, isFrozen, initialIsIntersecting]);
    return useMemo(() => ({
        ref,
        isIntersecting,
        entry,
    }), [ref, isIntersecting, entry]);
}
