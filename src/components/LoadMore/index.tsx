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

/**
 * @description A measurable page-loading sentinel, defaulting to a div with typed tag variants.
 * Loads once per entry or controlled busy-to-idle cycle; settling a promise alone
 * does not load another page. Errors pause automatic loading until re-entry or retry.
 * @param {LoadMoreProps} props - Sentinel and loading options.
 * @param {() => void | Promise<unknown>} props.onLoadMore - Request another page.
 * @param {boolean} props.hasMore - Whether another page is available.
 * @param {boolean} [props.busy] - Externally controlled loading flag.
 * @param {boolean} [props.disabled] - Disable loading.
 * @param {(error: unknown) => void} [props.onError] - Load failure callback.
 * @param {Element | null} [props.root] - Observer root; defaults to the viewport.
 * @param {string} [props.rootMargin] - Observer margin; defaults to "0%".
 * @param {number | number[]} [props.threshold] - Visibility thresholds; defaults to zero.
 * @param {ReactNode | ((state: LoadMoreState) => ReactNode)} [props.children] - Content or renderer receiving intersection, loading, error, and retry state.
 * @returns {React.ReactNode} The measurable sentinel element.
 * @example
 * ```tsx
 * <LoadMore hasMore={hasMore} onLoadMore={loadNextPage}>
 *   {({ isLoading, retry, isError }) => isError
 *     ? <button onClick={retry}>Retry</button>
 *     : isLoading ? "Loading..." : null}
 * </LoadMore>
 * ```
 */
export const LoadMore: LoadMoreType = createProxy(
  renderForTag("div"), renderForTag, "loadMore",
);

export type { LoadMoreProps, LoadMoreState, LoadMoreType } from "./types";
