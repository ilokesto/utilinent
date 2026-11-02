import type { ComponentPropsWithRef, ReactNode } from "react";
import type { BaseTypeHelperFn, ProxyType } from "../../types";

export interface LongPressProps {
  /** Continuous press duration in milliseconds. Defaults to 500. */
  duration?: number;
  /** Maximum distance from the initial pointer position in CSS pixels. Defaults to 10. */
  movementThreshold?: number;
  /** Receives the original native pointerdown event once the duration elapses. */
  onLongPress?: (event: PointerEvent) => void;
  /** Runs once when an activated long press ends, including cancellation or cleanup. */
  onLongPressEnd?: () => void;
  /** Disables pointer gestures and regular clicks, including keyboard activation. */
  disabled?: boolean;
  children?: ReactNode;
}

interface LongPressTypeHelper extends BaseTypeHelperFn {
  type: (props: LongPressProps & Omit<
    keyof this["props"] extends never ? ComponentPropsWithRef<"button"> : this["props"],
    keyof LongPressProps
  >) => ReactNode;
}

export type LongPressType = ProxyType<LongPressTypeHelper, "longPress">;
