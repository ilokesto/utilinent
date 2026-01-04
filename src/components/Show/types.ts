import { HtmlTag } from "../../constants/htmlTags";
import { Fallback, NonNullableElements } from "../../types";
import { RegisterProps } from "../../types/register";

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

type ShowTagHelper<K> = K extends keyof HtmlTag
  ? BaseShowType<Omit<React.ComponentPropsWithRef<HtmlTag[K]>, "children">>
  : K extends React.ComponentType<infer P>
    ? BaseShowType<Omit<P, "children">>
    : K;

export type ShowType = BaseShowType & {
  [K in keyof HtmlTag]: ShowTagHelper<HtmlTag[K]>;
} & {
  [K in keyof RegisterProps<"show">]: ShowTagHelper<RegisterProps<"show">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: ShowTagHelper<RegisterProps<"base">[K]>;
};
