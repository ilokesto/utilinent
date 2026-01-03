import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";
import { RegisterProps } from "./register";

export interface MatchProps<T = unknown> {
  when: T | null | undefined | false;
  children: React.ReactNode | ((item: NonNullable<T>) => React.ReactNode);
}

export interface SwitchProps extends Fallback {
  children: React.ReactNode;
}

type BaseSwitchType<X = object> = {
  (props: X & SwitchProps): React.ReactNode;
}

type SwitchTagHelper<K> = K extends keyof HtmlTag
  ? BaseSwitchType<Omit<React.ComponentPropsWithRef<K>, 'children'>>
  : K extends React.ComponentType<infer P>
    ? BaseSwitchType<Omit<P, 'children'>>
    : K;

export type SwitchType = BaseSwitchType & {
  [K in keyof HtmlTag]: SwitchTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof RegisterProps<"switch">]: SwitchTagHelper<RegisterProps<"switch">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: SwitchTagHelper<RegisterProps<"base">[K]>;
};
