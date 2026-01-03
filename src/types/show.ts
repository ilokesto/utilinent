import { ComponentPropsWithRef } from "react";
import { HtmlTag } from "../constants/htmlTags";
import { Fallback, NonNullableElements } from "./";
import { RegisterProps } from "./register";

export interface ShowPropsArray<T extends unknown[]> extends Fallback {
  when: T;
  children: React.ReactNode | ((item: NonNullableElements<T>) => React.ReactNode);
}

type BaseShowType<X = object> = {
  <const T extends Array<unknown>>(props: X & ShowPropsArray<T>): React.ReactNode;
  <const T extends unknown>(props: X & ShowProps<T>): React.ReactNode;
  }

export interface ShowProps<T = unknown> extends Fallback {
  when: T;
  children: React.ReactNode | ((item: NonNullable<T>) => React.ReactNode);
}

type ShowTagHelper<K> = K extends keyof HtmlTag
  ? BaseShowType<ComponentPropsWithRef<HtmlTag[K]>>
  : K extends React.ComponentType<infer P>
    ? BaseShowType<P>
    : K;

export type ShowType = BaseShowType & {
  [K in keyof HtmlTag]: ShowTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof RegisterProps<"show">]: ShowTagHelper<RegisterProps<"show">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: ShowTagHelper<RegisterProps<"base">[K]>;
};