import { HtmlTag } from "../../constants/htmlTags";
import { Fallback } from "../../types";
import { RegisterProps } from "../../types/register";

export interface ForProps<T extends Array<unknown>> extends Fallback {
  each: T | null | undefined; // 배열 또는 null/undefined 허용
  children: (item: T[number], index: number) => React.ReactNode;
};

type BaseForType<X = object> = {
  <const T extends Array<unknown>>(props: X & ForProps<T>): React.ReactNode;
}

type ForTagHelper<K> = K extends keyof HtmlTag
  ? BaseForType<Omit<React.ComponentPropsWithRef<HtmlTag[K]>, "children">>
  : K extends React.ComponentType<infer P>
    ? BaseForType<Omit<P, "children">>
    : K;

export type ForType = BaseForType & {
  [K in keyof HtmlTag]: ForTagHelper<HtmlTag[K]>;
} & {
  [K in keyof RegisterProps<"for">]: ForTagHelper<RegisterProps<"for">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: ForTagHelper<RegisterProps<"base">[K]>;
};
