import type { ExtractByKeyValue, ExtractValues, LiteralKeys, SwitchProps } from "./types";

export function createSwitcher<T, K extends LiteralKeys<T>>(data: T) {
  function Switch({ children, when, fallback = null }: SwitchProps<T, K>) {
    children.reduce((acc, { type, props }) => {
      if (type !== Match) throw new Error("Match 컴포넌트만 사용할 수 있습니다.");

      if (props.case) {
        if (acc.includes(props.case)) throw new Error(`Duplicate Match key: ${props.case}`);
        else acc.push(props.case)
      }

      return acc
    }, [] as Array<K>);

    return children.find(({ props }) => props.case === data[when]) ?? fallback;
  }

  function Match<V extends ExtractValues<T, K>>({ 
    children 
  }: { 
    case: V, 
    children: (props: ExtractByKeyValue<T, K, V>) => React.ReactNode 
  })  {
    return children(data as ExtractByKeyValue<T, K, V>);
  };

  return { Switch, Match };
}