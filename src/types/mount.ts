import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";
import { RegisterProps } from "./register";

export interface MountProps extends Fallback {
  children: React.ReactNode | (() => React.ReactNode | Promise<React.ReactNode>);
  onError?: (error: unknown) => void;
}

type BaseMountType<X = object> = {
  (props: X & MountProps): React.ReactNode;
}

type MountTagHelper<K> = K extends keyof HtmlTag
  ? BaseMountType<Omit<React.ComponentPropsWithRef<K>, 'children'>>
  : K extends React.ComponentType<infer P>
    ? BaseMountType<Omit<P, 'children'>>
    : K;

export type MountType = BaseMountType & {
  [K in keyof HtmlTag]: MountTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof RegisterProps<"mount">]: MountTagHelper<RegisterProps<"mount">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: MountTagHelper<RegisterProps<"base">[K]>;
};
