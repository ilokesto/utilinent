import { useInsertionEffect, useMemo, useRef, type DependencyList } from "react";

/**
 * @description Runs setup when an HTML element attaches and cleans up exactly once
 * on detachment, replacement, dependency changes, or unmount. The callback ref
 * stays stable while dependencies are Object.is-equal. Updating setup alone does
 * not restart it; the next attachment uses the latest committed setup. The callback returns
 * void on both React 18 and React 19, rather than exposing React 19 ref cleanup.
 * @example
 * ```tsx
 * const ref = useRefEffect<HTMLDivElement>((node) => {
 *   const observer = new ResizeObserver(onResize);
 *   observer.observe(node);
 *   return () => observer.disconnect();
 * }, [onResize]);
 * return <div ref={ref}>Observed content</div>;
 * ```
 * @param {(node: T) => void | (() => void)} setup - Sets up the attached element
 * and optionally returns its cleanup function.
 * @param {DependencyList} deps - Dependencies that restart setup on an attached
 * element when any entry changes, using React's Object.is comparison.
 * @returns {(node: T | null) => void} Stable callback ref accepting the attached
 * element or null when detached.
 */
export function useRefEffect<T extends HTMLElement>(
  setup: (node: T) => void | (() => void),
  deps: DependencyList,
): (node: T | null) => void {
  const setupRef = useRef(setup);
  // Publish committed setup before React attaches refs, without exposing a
  // suspended render or waiting until the later layout-effect phase.
  useInsertionEffect(() => {
    setupRef.current = setup;
  }, [setup]);

  return useMemo(() => {
    let target: T | null = null;
    let cleanup: void | (() => void);

    return (node: T | null): void => {
      if (target === node) {
        return;
      }

      const previousCleanup = cleanup;
      cleanup = undefined;
      target = node;
      previousCleanup?.();

      if (node !== null) {
        cleanup = setupRef.current(node);
      }
    };
  }, deps);
}
