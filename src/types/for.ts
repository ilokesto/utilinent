import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";
import { RegisterProps } from "./register";

export interface ForProps<T extends Array<unknown>> extends Fallback {
  each: T | null | undefined; // 배열 또는 null/undefined 허용
  children: (item: T[number], index: number) => React.ReactNode;
};

type BaseForType<X = object> = {
  <const T extends Array<unknown>>(props: X & ForProps<T>): React.ReactNode;
}

type ForTagHelper<K> = K extends keyof HtmlTag
  ? BaseForType<React.ComponentPropsWithRef<HtmlTag[K]>>
  : K extends React.ComponentType<infer P>
    ? BaseForType<P>
    : K;

export type ForType = BaseForType & {
  [K in keyof HtmlTag]: ForTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof RegisterProps<"for">]: ForTagHelper<RegisterProps<"for">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: ForTagHelper<RegisterProps<"base">[K]>;
};