import { isValidElement } from "react";

/**
 * @description Tests whether a node is a Slottable marker element.
 * @param {React.ReactNode} child - Node to inspect.
 * @returns {boolean} Whether the node is a Slottable React element.
 * @example
 * ```tsx
 * isSlottable(<Slottable><button>Save</button></Slottable>); // true
 * ```
 */
export function isSlottable(child: React.ReactNode): child is React.ReactElement {
  return isValidElement(child) && child.type === Slottable;
}

/**
 * @description Marks a child as the slottable content within a {@link Slot} that has multiple children.
 *
 * The slottable child receives the merged props from Slot; other children
 * are rendered alongside it as-is.
 * @param {{ children: React.ReactNode }} props - Marker content.
 * @param {React.ReactNode} props.children - Child selected by Slot for prop merging.
 * @returns {React.ReactElement} A fragment containing children.
 * @example
 * ```tsx
 * <Slot><span>Label</span><Slottable><button>Save</button></Slottable></Slot>
 * ```
 */
export const Slottable = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
