import { createElement, forwardRef, useMemo } from "react";
import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import { createProxy } from "../../core/createProxy";
import { useInfiniteSentinel } from "../../hooks/useInfiniteSentinel";
import { composeRefs } from "../../utils/composeRefs";
import type { LoadMoreProps, LoadMoreType } from "./types";

function renderForTag(tag: ElementType) {
  return forwardRef<HTMLElement, LoadMoreProps & Omit<HTMLAttributes<HTMLElement>, keyof LoadMoreProps>>(
    function LoadMore(
      { onLoadMore, hasMore, busy, disabled, onError, root, rootMargin, threshold,
        children, style, ...props },
      forwardedRef,
    ) {
      const { ref, ...state } = useInfiniteSentinel({
        onLoadMore, hasMore, busy, disabled, onError, root, rootMargin, threshold,
      });
      const mergedRef = useMemo(() => composeRefs(ref, forwardedRef), [ref, forwardedRef]);
      const sentinelStyle: CSSProperties = {
        minHeight: "1px", minWidth: "1px", display: "block", ...style,
      };
      return createElement(
        tag, { ...props, style: sentinelStyle, ref: mergedRef },
        typeof children === "function" ? children(state) : children,
      );
    },
  );
}

/** A measurable, repeatable page-loading sentinel. Defaults to a div. */
export const LoadMore: LoadMoreType = createProxy(
  renderForTag("div"), renderForTag, "loadMore",
);

export type { LoadMoreProps, LoadMoreState, LoadMoreType } from "./types";
