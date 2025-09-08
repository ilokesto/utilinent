import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import { Show } from "./Show";
import type { ObserverProps } from "./types";

export function Observer({
  children,
  fallback = null,
  threshold = 0,
  rootMargin = "0px",
  triggerOnce = false,
  onIntersect,
}: ObserverProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    freezeOnceVisible: triggerOnce,
    onChange: onIntersect,
  });

  return (
    <div
      ref={ref}
      style={
        // fallback이 없고 isIntersecting이 false인 경우
        !fallback && !isIntersecting
          ? {
              minHeight: "1px",
              minWidth: "1px",
              flexShrink: 0, // flex 컨테이너에서 축소되지 않도록
              display: "block", // inline 요소가 되지 않도록
            }
          : undefined
      }
    >
      <Show when={isIntersecting} fallback={fallback}>
        {typeof children === "function" ? children(isIntersecting) : children}
      </Show>
    </div>
  );
}
