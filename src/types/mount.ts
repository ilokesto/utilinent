import { ComponentPropsWithRef } from "react";
import { HtmlTag } from "../constants/htmlTags";
import { MountProps } from ".";
import { UtilinentRegisterBase, UtilinentRegisterMount } from "./register";

type MountTagHelper<K extends HtmlTag> = {
  (props: MountProps & Omit<ComponentPropsWithRef<K>, "children">): React.ReactNode;
};

// 등록된 컴포넌트를 MountProps와 함께 사용할 수 있도록 래핑하는 헬퍼 타입
type MountRegisterHelper<C> = C extends React.ComponentType<infer P>
  ? {
      (props: Omit<P, "children"> & MountProps): React.ReactNode;
    }
  : C;

export type MountType = {
  (props: MountProps): React.ReactNode;
} & {
  [K in HtmlTag]: MountTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof UtilinentRegisterMount]: MountRegisterHelper<UtilinentRegisterMount[K]>;
} & {
  [K in keyof UtilinentRegisterBase]: MountRegisterHelper<UtilinentRegisterBase[K]>;
};
