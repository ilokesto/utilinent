
import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";
import { RegisterProps } from "./register";

export interface ForProps<T extends Array<unknown>> extends Fallback {
  each: T | null | undefined; // 배열 또는 null/undefined 허용
  children: (item: T[number], index: number) => React.ReactNode;
};

type ForTagHelper<K> = K extends keyof HtmlTag
  ? {<const T extends Array<unknown>>(props:  Omit<React.ComponentPropsWithRef<K>, 'children'> & ForProps<T>): React.ReactNode;}
  : K extends React.ComponentType<infer P>
    ? {<const T extends Array<unknown>>(props: Omit<P, 'children'> & ForProps<T>): React.ReactNode;}
    : K;

export type ForType = {
    <const T extends Array<unknown>>(props: ForProps<T>): React.ReactNode;
} & {
    [K in keyof HtmlTag]: ForTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof RegisterProps<"for">]: ForTagHelper<RegisterProps<"for">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: ForTagHelper<RegisterProps<"base">[K]>;
};