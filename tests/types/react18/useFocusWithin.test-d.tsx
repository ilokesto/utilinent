import type { RefCallback } from "react";
import { useFocusWithin } from "../../../src/hooks";

type Assert<Condition extends true> = Condition;
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Result = ReturnType<typeof useFocusWithin>;

export type FocusWithinTypeContract = [
  Assert<Equal<Parameters<typeof useFocusWithin>, []>>,
  Assert<Equal<keyof Result, "ref" | "isFocusWithin">>,
  Assert<Equal<Result["isFocusWithin"], boolean>>,
  Assert<Equal<Parameters<Result["ref"]>, [HTMLElement | null]>>,
  Assert<Equal<ReturnType<Result["ref"]>, void>>,
  Assert<Result["ref"] extends RefCallback<HTMLDivElement> ? true : false>,
  Assert<Result["ref"] extends RefCallback<HTMLButtonElement> ? true : false>,
  Assert<Equal<SVGElement extends Parameters<Result["ref"]>[0] ? true : false, false>>,
];

export function FocusWithinConsumer() {
  const { ref, isFocusWithin } = useFocusWithin();
  return <div ref={ref} data-focused={isFocusWithin}><button>Child</button></div>;
}
