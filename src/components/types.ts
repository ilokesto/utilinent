import { Key, ReactElement, ReactNode } from "react";

export type { Key };

export type ShowProps = {
  when: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export type MapProps<T> = {
  each: T[] | null | undefined; 
  fallback?: ReactNode;
  children: (item: NonNullable<T>, index: number) => ReactNode;
};

export type SwitchProps = {
  children: Array<ReactElement>,
  when: Key,
  fallback?: ReactNode
}

export type MatchProps = {
  children: ReactNode,
  element?: never
} | {
  children?: never,
  element: ReactNode
}