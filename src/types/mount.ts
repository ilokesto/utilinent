import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";
import { RegisterProps } from "./register";

export interface MountProps extends Fallback {
  children: React.ReactNode | (() => React.ReactNode | Promise<React.ReactNode>);
  onError?: (error: unknown) => void;
}

type MountTagHelper<K> = K extends keyof HtmlTag
  ? {(props:  Omit<React.ComponentPropsWithRef<K>, 'children'> & MountProps): React.ReactNode;}
  : K extends React.ComponentType<infer P>
    ? {(props: Omit<P, 'children'> & MountProps): React.ReactNode;}
    : K;

export type MountType = {
  (props: MountProps): React.ReactNode;
} & {
  [K in keyof HtmlTag]: MountTagHelper<K>;
} & {
  // Register에 등록된 컴포넌트들을 자동으로 추가
  [K in keyof RegisterProps<"mount">]: MountTagHelper<RegisterProps<"mount">[K]>;
} & {
  [K in keyof RegisterProps<"base">]: MountTagHelper<RegisterProps<"base">[K]>;
};
