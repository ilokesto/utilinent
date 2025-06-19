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

export type ExtractValues<T, K extends keyof T> = T extends any ? T[K] : never;
export type ExtractByKeyValue<T, K extends keyof T, V> = T extends any 
  ? T[K] extends V 
    ? T 
    : never 
  : never;

export type LiteralKeys<T> = {
  [K in keyof T]: T[K] extends string 
    ? string extends T[K] 
      ? never 
      : K
    : T[K] extends number
    ? number extends T[K]
      ? never
      : K
    : T[K] extends boolean
    ? boolean extends T[K]
      ? never
      : K
    : T[K] extends bigint
    ? bigint extends T[K]
      ? never
      : K
    : T[K] extends symbol
    ? symbol extends T[K]
      ? never
      : K
    : never;
}[keyof T];

export type SwitchProps<T, K extends LiteralKeys<T>> = {
  children: Array<ReactElement>,
  when: K,
} & Fallback;

export type MountProps = {
  children: ReactNode | (() => ReactNode | Promise<ReactNode>);
} & Fallback;