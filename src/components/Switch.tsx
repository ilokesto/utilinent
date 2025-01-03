import type { MatchProps, SwitchProps, Case } from "./types";

export function Match({ children, element }: MatchProps) {
  return children ?? element;
};

export function Switch({ children, when, fallback = null }: SwitchProps) {
  children.reduce((acc, { type, props }) => {
    if (type !== Match) throw new Error("Match 컴포넌트만 사용할 수 있습니다.");

    if (props.case) {
      if (acc.includes(props.case)) throw new Error(`Duplicate Match key: ${props.case}`);
      else acc.push(props.case)
    }

    return acc
  }, [] as Array<Case>)

  return children.find(({ props }) => props.case === when) ?? fallback
}