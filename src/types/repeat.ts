import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";
import { RegisterProps } from "./register";

export interface RepeatProps extends Fallback {
  times: number; 
  children: (index: number) => React.ReactNode; 
}

type RepeatTagHelper<K> = K extends keyof HtmlTag
  ? {(props:  Omit<React.ComponentPropsWithRef<K>, 'children'> & RepeatProps): React.ReactNode;}
  : K extends React.ComponentType<infer P>
    ? {(props: Omit<P, 'children'> & RepeatProps): React.ReactNode;}
    : K;

export type RepeatType = {
  (props: RepeatProps): React.ReactNode;
} & {
  [K in keyof HtmlTag]: RepeatTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof RegisterProps<"repeat">]: RepeatTagHelper<RegisterProps<"repeat">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: RepeatTagHelper<RegisterProps<"base">[K]>;
};