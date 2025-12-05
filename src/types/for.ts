
import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";
import { UtilinentRegisterBase, UtilinentRegisterFor } from "./register";

export interface ForProps<T extends Array<unknown>> extends Fallback {
  each: T | null | undefined; // 배열 또는 null/undefined 허용
  children: (item: T[number], index: number) => React.ReactNode;
  before?: React.ReactNode;
  after?: React.ReactNode;
}

type ForTagHelper<K extends HtmlTag> = {
  <const T extends Array<unknown>>(props: ForProps<T> & Omit<React.ComponentPropsWithRef<K>, 'children'>): React.ReactNode;
};

// 등록된 컴포넌트를 ForProps와 함께 사용할 수 있도록 래핑하는 헬퍼 타입
type ForRegisterHelper<C> = C extends React.ComponentType<infer P>
  ? {
      <const T extends Array<unknown>>(props: Omit<P, "children"> & ForProps<T>): React.ReactNode;
    }
  : C;

export type ForType = {
    <const T extends Array<unknown>>(props: ForProps<T>): React.ReactNode;
} & {
    [K in HtmlTag]: ForTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof UtilinentRegisterFor]: ForRegisterHelper<UtilinentRegisterFor[K]>;
} & {
  [K in keyof UtilinentRegisterBase]: ForRegisterHelper<UtilinentRegisterBase[K]>;
};