import type { Fallback, NonNullableElements, TagHelperFn, TagProxyType } from "../../types";

export interface ShowPropsArray<T extends unknown[]> extends Fallback {
  when: T;
  children: React.ReactNode | ((item: NonNullableElements<T>) => React.ReactNode);
}

export interface ShowProps<T = unknown> extends Fallback {
  when: T;
  children: React.ReactNode | ((item: NonNullable<T>) => React.ReactNode);
}

type BaseShowType<X = object> = {
  <const T extends Array<unknown>>(props: X & ShowPropsArray<T>): React.ReactNode;
  <const T extends unknown>(props: X & ShowProps<T>): React.ReactNode;
}

interface BaseShowTypeFn extends TagHelperFn {
  type: BaseShowType<this["props"]>;
}

export type ShowType = TagProxyType<BaseShowTypeFn, "show">;