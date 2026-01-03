import { ComponentPropsWithRef } from "react";
import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";
import { RegisterProps } from "./register";

export interface RepeatProps extends Fallback {
  times: number; 
  children: (index: number) => React.ReactNode; 
}

type RepeatTagHelper<K extends HtmlTag> = {
  (props: RepeatProps & Omit<ComponentPropsWithRef<K>, "children">): React.ReactNode;
};

// 등록된 컴포넌트를 RepeatProps와 함께 사용할 수 있도록 래핑하는 헬퍼 타입
type RepeatRegisterHelper<C> = C extends React.ComponentType<infer P>
  ? {
      (props: Omit<P, "children"> & RepeatProps): React.ReactNode;
    }
  : C;

export type RepeatType = {
  (props: RepeatProps): React.ReactNode;
} & {
  [K in HtmlTag]: RepeatTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof RegisterProps<"repeat">]: RepeatRegisterHelper<RegisterProps<"repeat">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: RepeatRegisterHelper<RegisterProps<"base">[K]>;
};