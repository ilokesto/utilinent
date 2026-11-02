import type { DependencyList, RefCallback } from "react";
import { useRefEffect } from "../../../src/hooks";

type Assert<Condition extends true> = Condition;
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Hook = typeof useRefEffect<HTMLButtonElement>;
type Result = ReturnType<Hook>;

export type RefEffectTypeContract = [
  Assert<Equal<Parameters<Hook>, [(node: HTMLButtonElement) => void | (() => void), DependencyList]>>,
  Assert<Equal<Parameters<Result>, [HTMLButtonElement | null]>>,
  Assert<Equal<ReturnType<Result>, void>>,
  Assert<Result extends RefCallback<HTMLButtonElement> ? true : false>,
  Assert<Equal<SVGElement extends Parameters<Parameters<typeof useRefEffect>[0]>[0] ? true : false, false>>,
];

export function RefEffectConsumer() {
  const ref = useRefEffect<HTMLButtonElement>((button) => {
    button.focus();
    return () => button.blur();
  }, []);
  const noCleanup = useRefEffect<HTMLDivElement>((node) => { node.focus(); }, []);
  return <div ref={noCleanup}><button ref={ref}>Focus</button></div>;
}
