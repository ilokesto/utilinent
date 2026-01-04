import type { Fallback, TagHelperFn, TagProxyType } from "../../types";

export interface MountProps extends Fallback {
  children: React.ReactNode | (() => React.ReactNode | Promise<React.ReactNode>);
  onError?: (error: unknown) => void;
}

type BaseMountType<X = object> = {
  (props: X & MountProps): React.ReactNode;
}

interface BaseMountTypeFn extends TagHelperFn {
  type: BaseMountType<this["props"]>;
}

export type MountType = TagProxyType<BaseMountTypeFn, "mount">;