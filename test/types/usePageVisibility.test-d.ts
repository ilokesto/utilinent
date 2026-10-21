import { createElement, type ReactElement, type ReactNode } from "react";
import { usePageVisibility } from "../../src/hooks";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Assert<Condition extends true> = Condition;

export type PageVisibilityReact18Contract = [
  Assert<Equal<Parameters<typeof usePageVisibility>, []>>,
  Assert<Equal<ReturnType<typeof usePageVisibility>, boolean>>,
  Assert<Equal<Promise<string> extends ReactNode ? true : false, false>>,
];

export function VisibilityProbe(): ReactElement {
  const isVisible = usePageVisibility();
  return createElement("output", null, isVisible ? "visible" : "hidden");
}
