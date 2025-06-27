import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Show } from "./Show";
export function IntersectionObserver({ children, fallback, threshold = 0, rootMargin = "0px", triggerOnce = false, onIntersect, }) {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);
    const [entry, setEntry] = useState();
    const elementRef = useRef(null);
    useEffect(() => {
        const element = elementRef.current;
        // 요소가 없으면 관찰하지 않음
        if (!element) {
            return;
        }
        // triggerOnce가 true이고 이미 트리거되었으면 관찰하지 않음
        if (triggerOnce && hasTriggered) {
            return;
        }
        // IntersectionObserver가 지원되지 않는 브라우저에서는 항상 intersecting으로 처리
        if (!window.IntersectionObserver) {
            setIsIntersecting(true);
            return;
        }
        const observer = new window.IntersectionObserver((entries) => {
            const [entry] = entries;
            const isCurrentlyIntersecting = entry.isIntersecting;
            setIsIntersecting(isCurrentlyIntersecting);
            setEntry(entry);
            // onIntersect 콜백 호출
            if (onIntersect) {
                onIntersect(isCurrentlyIntersecting, entry);
            }
            // triggerOnce가 true이고 교차가 시작되면 더 이상 관찰하지 않음
            if (triggerOnce && isCurrentlyIntersecting) {
                setHasTriggered(true);
                observer.unobserve(element);
            }
        }, {
            threshold,
            rootMargin,
        });
        observer.observe(element);
        // cleanup
        return () => {
            observer.unobserve(element);
        };
    }, [threshold, rootMargin, triggerOnce, hasTriggered, onIntersect]);
    const content = typeof children === 'function'
        ? children(isIntersecting)
        : children;
    return (_jsx("div", { ref: elementRef, style: 
        // fallback이 없고 isIntersecting이 false인 경우
        !fallback && !isIntersecting
            ? {
                minHeight: '1px',
                minWidth: '1px',
                flexShrink: 0, // flex 컨테이너에서 축소되지 않도록
                display: 'block' // inline 요소가 되지 않도록
            }
            : undefined, children: _jsx(Show, { when: isIntersecting, fallback: fallback, children: content }) }));
}
