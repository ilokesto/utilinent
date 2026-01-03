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

type SwitchTagHelper<K> = K extends keyof HtmlTag
  ? {(props:  Omit<React.ComponentPropsWithRef<K>, 'children'> & SwitchProps): React.ReactNode;}
  : K extends React.ComponentType<infer P>
    ? {(props: Omit<P, 'children'> & SwitchProps): React.ReactNode;}
    : K;

export type SwitchType = {
  (props: SwitchProps): React.ReactNode;
} & {
  [K in keyof HtmlTag]: SwitchTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof RegisterProps<"switch">]: SwitchTagHelper<RegisterProps<"switch">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: SwitchTagHelper<RegisterProps<"base">[K]>;
};
