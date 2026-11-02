import { useEffect, useLayoutEffect } from "react";

/**
 * @description Selects React's useLayoutEffect when window exists at module
 * evaluation, otherwise useEffect. Preserves client layout timing without server
 * layout-effect warnings; React runs cleanup before reruns and on unmount.
 *
 * @param {React.EffectCallback} effect - Setup callback that may return cleanup.
 * @param {React.DependencyList} [deps] - Reactive dependencies; omitted means every commit.
 * @returns {void} Schedules a React effect rather than returning its cleanup.
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useIsomorphicLayoutEffect(() => {
 *   ref.current?.focus();
 * }, []);
 * return <div ref={ref} tabIndex={-1} />;
 * ```
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
