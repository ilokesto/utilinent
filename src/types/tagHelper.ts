import { HtmlTag } from "../constants/htmlTags";
import { RegisterProps } from "./register";
import { RepeatProps } from "./repeat";

export interface TagHelperFn {
  props: unknown;
  type: unknown;
}

type Apply<F extends TagHelperFn, Props> = (F & { props: Props })["type"];

export type TagHelper<K, F extends TagHelperFn> = K extends keyof HtmlTag
  ? Apply<F, Omit<React.ComponentPropsWithRef<K>, "children">>
  : K extends React.ComponentType<infer P>
    ? Apply<F, Omit<P, "children">>
    : K;


type BaseRepeatType<X = object> = {
  (props: X & RepeatProps): React.ReactNode;
}

interface BaseRepeatTypeFn extends TagHelperFn {
  type: BaseRepeatType<this["props"]>;
}

type TestTagHelper<K> = TagHelper<K, BaseRepeatTypeFn>;

type TestType = BaseRepeatType & {
  [K in keyof HtmlTag]: TestTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof RegisterProps<"repeat">]: TestTagHelper<RegisterProps<"repeat">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: TestTagHelper<RegisterProps<"base">[K]>;
};
