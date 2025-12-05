import { ComponentPropsWithRef } from "react";
import { HtmlTag } from "../constants/htmlTags";
import { Fallback, NonNullableElements } from "./";
import { UtilinentRegisterBase, UtilinentRegisterShow } from "./register";

export interface ShowPropsArray<T extends unknown[]> extends Fallback {
  when: T;
  children: React.ReactNode | ((item: NonNullableElements<T>) => React.ReactNode);
}

export interface ShowProps<T = unknown> extends Fallback {
  when: T;
  children: React.ReactNode | ((item: NonNullable<T>) => React.ReactNode);
}

type ShowTagHelper<K extends HtmlTag> = {
  <const T extends unknown[]>(props: Omit<ComponentPropsWithRef<K>, "children"> & ShowPropsArray<T>): React.ReactNode;
  <const T extends unknown>(props: Omit<ComponentPropsWithRef<K>, "children"> & ShowProps<T>): React.ReactNode;
};

// 등록된 컴포넌트를 ShowProps와 함께 사용할 수 있도록 래핑하는 헬퍼 타입
type ShowRegisterHelper<C> = C extends React.ComponentType<infer P>
  ? {
      <const T extends unknown[]>(props: Omit<P, "children"> & ShowPropsArray<T>): React.ReactNode;
      <const T extends unknown>(props: Omit<P, "children"> & ShowProps<T>): React.ReactNode;
    }
  : C;

export type ShowType = {
  <const T extends unknown[]>(props: ShowPropsArray<T>): React.ReactNode;
  <const T extends unknown>(props: ShowProps<T>): React.ReactNode;
} & {
  [K in HtmlTag]: ShowTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof UtilinentRegisterShow]: ShowRegisterHelper<UtilinentRegisterShow[K]>;
} & {
  [K in keyof UtilinentRegisterBase]: ShowRegisterHelper<UtilinentRegisterBase[K]>;
};