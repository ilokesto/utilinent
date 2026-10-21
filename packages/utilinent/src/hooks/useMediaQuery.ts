import { useState } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 *
 * SSR-safe: the server render and the client's first hydration render share
 * the same initial snapshot (`false`), so hydrated markup never mismatches.
 * The actual match is applied synchronously before the first paint.
 *
 * @example
 * ```tsx
 * const isDesktop = useMediaQuery('(min-width: 768px)');
 * return isDesktop ? <DesktopNav /> : <MobileNav />;
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Deterministic initial snapshot: the first client render (including
  // hydration) always starts from `false`, matching the server output.
  const [matches, setMatches] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener("change", onChange);
    return () => {
      mediaQueryList.removeEventListener("change", onChange);
    };
  }, [query]);

  return matches;
}
