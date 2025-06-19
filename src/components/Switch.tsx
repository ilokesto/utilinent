import type { ExtractExact, ExtractKeyValues, LiteralKeys, MatchProps, SwitchProps } from "./types";

export function createSwitchMatch<T, K extends LiteralKeys<T>>(data: T) {
  function Switch({ children, when, fallback = null }: SwitchProps<T, K>) {
    children.reduce((acc, { type, props }) => {
      if (type !== Match) throw new Error("Match 컴포넌트만 사용할 수 있습니다.");

      if (props.case) {
        if (acc.includes(props.case)) throw new Error(`Duplicate Match key: ${props.case}`);
        else acc.push(props.case)
      }

      return acc
    }, [] as any)

    return children.find(({ props }) => props.case === when) ?? fallback;
  }

  function Match<C extends ExtractKeyValues<T, K>>({ children }: MatchProps<T, K, C>) {
    return children(data as ExtractExact<T, K, C>);
  };

  return { Switch, Match };
}