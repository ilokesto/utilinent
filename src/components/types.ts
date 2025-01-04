import { ReactElement, ReactNode } from "react";

export type ShowProps<T> = {
  when: T;
  children: ReactNode | ((item: T) => ReactNode);
  fallback?: ReactNode;
}

export type ForProps<T extends Array<unknown>> = {
  each: T | null | undefined; 
  fallback?: ReactNode;
  children: (item: T[number], index: number) => ReactNode;
};

export type Case = string | number | boolean | null | undefined;

export type SwitchProps = {
  children: Array<ReactElement>,
  when: Case,
  fallback?: ReactNode
}

export type MatchProps = {
  case: Case,
  children: ReactNode,
  element?: never
} | {
  case: Case,
  children?: never,
  element: ReactNode
}

export type MountProps = {
  children: ReactNode;
  fallback?: ReactNode 
}