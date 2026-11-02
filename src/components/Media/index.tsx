import { useMediaQuery } from "../../hooks/useMediaQuery";
import type { MediaProps } from "./types";

/**
 * @description Renders children based on a CSS media query match.
 *
 * With a render-prop, receives the current `matches` boolean. Otherwise renders
 * `children` when the query matches and `fallback` when it does not.
 * @param {MediaProps} props - Responsive content options.
 * @param {string} props.query - CSS media query.
 * @param {React.ReactNode | ((matches: boolean) => React.ReactNode)} [props.children] - Content or match-state renderer.
 * @param {React.ReactNode} [props.fallback] - Nonmatching content; defaults to null.
 * @returns {React.ReactNode} The renderer result or selected content.
 *
 * @example
 * ```tsx
 * <Media query="(min-width: 768px)">{(matches) => matches ? <Desktop/> : <Mobile/>}</Media>
 * <Media query="(min-width: 768px)" fallback={<MobileNav/>}><DesktopNav/></Media>
 * ```
 */
export function Media({ query, children, fallback = null }: MediaProps): React.ReactNode {
  const matches = useMediaQuery(query);

  if (typeof children === "function") {
    return children(matches);
  }

  return matches ? children : fallback;
}
