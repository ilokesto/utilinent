import { Key, ReactElement, ReactNode } from "react";

export type ShowProps = {
  when: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export type MapProps<T extends Array<unknown>> = {
  each: T | null | undefined; 
  fallback?: ReactNode;
  children: (item: T[number], index: number) => ReactNode;
};

export type Case = Key | boolean | null;

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


const a: Array<string> = []

let b: Array<string>[number]