import { ComponentPropsWithRef } from "react";
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

type SwitchTagHelper<K extends HtmlTag> = {
  (props: SwitchProps & Omit<ComponentPropsWithRef<K>, "children">): React.ReactNode;
};

// 등록된 컴포넌트를 SwitchProps와 함께 사용할 수 있도록 래핑하는 헬퍼 타입
type SwitchRegisterHelper<C> = C extends React.ComponentType<infer P>
  ? {
      (props: Omit<P, "children"> & SwitchProps): React.ReactNode;
    }
  : C;

export type SwitchType = {
  (props: SwitchProps): React.ReactNode;
} & {
  [K in HtmlTag]: SwitchTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof RegisterProps<"switch">]: SwitchRegisterHelper<RegisterProps<"switch">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: SwitchRegisterHelper<RegisterProps<"base">[K]>;
};
