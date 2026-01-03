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
  [K in keyof HtmlTag]: RepeatTagHelper<HtmlTag[K]>;
} & {
  [K in keyof RegisterProps<"repeat">]: RepeatTagHelper<RegisterProps<"repeat">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: RepeatTagHelper<RegisterProps<"base">[K]>;
};
