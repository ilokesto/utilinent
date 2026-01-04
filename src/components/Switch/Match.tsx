import { isValidElement } from "react";
import { resolveWhen } from "../../utils/resolveWhen";
import { MatchProps } from "./types";

export function Match<T>({ when, children }: MatchProps<T>) {
  if (!resolveWhen(when)) {
    return null;
  }

  return typeof children === "function"
    ? (children as (value: NonNullable<T>) => React.ReactNode)(when as NonNullable<T>)
    : children;
}

export const isMatchElement = (child: React.ReactNode): child is React.ReactElement<MatchProps> =>
  isValidElement(child) && child.type === Match;