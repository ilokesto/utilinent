import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";
import { RegisterProps } from "./register";

export interface RepeatProps extends Fallback {
  times: number; 
  children: (index: number) => React.ReactNode; 
}

type BaseRepeatType<X = object> = {
  (props: X & RepeatProps): React.ReactNode;
}

type RepeatTagHelper<K> = K extends keyof HtmlTag
  ? BaseRepeatType<React.ComponentPropsWithRef<HtmlTag[K]>>
  : K extends React.ComponentType<infer P>
    ? BaseRepeatType<P>
    : K;

export type RepeatType = BaseRepeatType & {
  [K in keyof HtmlTag]: RepeatTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof RegisterProps<"repeat">]: RepeatTagHelper<RegisterProps<"repeat">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: RepeatTagHelper<RegisterProps<"base">[K]>;
};
