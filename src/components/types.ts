import type { ReactElement, ReactNode } from "react";

export { ReactNode }
type Fallback = { fallback?: ReactNode };

export type ShowProps<T> = {
  when: T;
  children: ReactNode | ((item: T) => ReactNode);
} & Fallback;

export type ForProps<T extends Array<unknown>> = {
  each: T | null | undefined; 
  fallback?: ReactNode;
  children: (item: T[number], index: number) => ReactNode;
};

export type ExtractKeyValues<T, K extends keyof T> = T extends any ? T[K] : never; 
export type ExtractExact<T, K extends keyof T, V extends T[K]> = T extends Record<K, V> ? T : never;
export type LiteralKeys<T> = {
  [K in keyof T]: T[K] extends string 
    ? string extends T[K] 
      ? never 
      : K
    : never;
}[keyof T];

export type SwitchProps<T, K extends LiteralKeys<T>> = {
  children: Array<ReactElement>,
  when: K,
} & Fallback;

export type MatchProps<T, K extends keyof T, C extends ExtractKeyValues<T, K>> = {
  case: C;
  children: (props: ExtractExact<T, K, C>) => ReactNode;
}

export type MountProps = {
  children: ReactNode | (() => ReactNode | Promise<ReactNode>);
} & Fallback;