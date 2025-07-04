import type { ReactElement, ReactNode } from "react";

export { ReactNode }
type Fallback = { fallback?: ReactNode };

export type ShowProps<T> = {
  when: T;
  children: ReactNode | ((item: NonNullable<T>) => ReactNode);
} & Fallback;

export type ForProps<T extends Array<unknown>> = {
  each: T | null | undefined; 
  fallback?: ReactNode;
  children: (item: T[number], index: number) => ReactNode;
};

export type ExtractValues<T, K extends keyof T> = T extends any ? T[K] : never;

// 더 정확한 Union 타입 감지
type IsUnion<T, U = T> = T extends any ? [U] extends [T] ? false : true : false;

// 개선된 ExtractByKeyValue
export type ExtractByKeyValue<T, K extends keyof T, V> = 
  T extends any 
    ? IsUnion<T> extends true
      ? T[K] extends V 
        ? T 
        : never
      : V extends T[K]
        ? T
        : never
    : never;

export type GetLiteralKeys<T> = {
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

export type LiteralKeys<T> = [GetLiteralKeys<T>] extends [never] ? keyof T : GetLiteralKeys<T>;

export type SwitchProps<T, K extends LiteralKeys<T>> = {
  children: Array<ReactElement>,
  when: K,
} & Fallback;

export type MountProps = {
  children: ReactNode | (() => ReactNode | Promise<ReactNode>);
} & Fallback;

export type RepeatProps = {
  times: number;
  children: (index: number) => ReactNode;
} & Fallback;

export type ObserverProps = {
  children?: ReactNode | ((isIntersecting: boolean) => ReactNode);
  fallback?: ReactNode;
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  onIntersect?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
};

export type SlackerProps = {
  children: (loaded: any) => ReactNode;            // loader의 결과를 받는 함수
  fallback?: ReactNode;                            // 뷰포트에 보이지 않을 때 표시할 내용
  threshold?: number | number[];
  rootMargin?: string;
  loader: () => Promise<any> | any;                // 동적 로딩 함수 (필수)
};