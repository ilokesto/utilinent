import type { MatchProps, SwitchProps, Key } from "./types";

export const Match = ({ children }: MatchProps) => children;

export function Switch({ children, when, fallback = null }: SwitchProps) {
  children.reduce((acc, value) => {
    if (value.type !== Match) throw new Error("Match 컴포넌트만 사용할 수 있습니다.");

    if (value.key) {
      if (acc.includes(value.key)) throw new Error(`Duplicate Match key: ${value.key}`);
      else acc.push(value.key)
    }

    return acc
  }, [] as Array<Key>)

  return children.find(value => value.key === when) ?? fallback
}