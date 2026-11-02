import { Children, Fragment, isValidElement } from "react";

/**
 * @description Flattens React child arrays and recursively unwraps fragments
 * so Switch can inspect Match elements without traversing other components.
 * @param {React.ReactNode} nodes - Children to normalize.
 * @returns {React.ReactNode[]} Flattened children with fragment wrappers removed.
 * @example
 * ```tsx
 * flattenChildren(<><Match when={true}>Ready</Match></>);
 * ```
 */
export const flattenChildren = (nodes: React.ReactNode): React.ReactNode[] =>
  Children.toArray(nodes).flatMap((child) => {
    if (isValidElement(child) && child.type === Fragment) {
      return flattenChildren(child.props.children);
    }
    return [child];
  });
