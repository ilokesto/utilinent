import type { ReactNode } from "react";
import type { UsePendingDelayOptions } from "../../hooks/usePendingDelay";
import type { BaseTypeHelperFn, Fallback, ProxyType } from "../../types";

export interface DelayedFallbackProps extends UsePendingDelayOptions, Fallback {
  pending: boolean;
  children?: ReactNode;
}

interface DelayedFallbackTypeFn extends BaseTypeHelperFn {
  type: (props: this["props"] & DelayedFallbackProps) => ReactNode;
}

export type DelayedFallbackType = ProxyType<DelayedFallbackTypeFn, "delayedFallback">;
