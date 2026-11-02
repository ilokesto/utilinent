import type { ComponentPropsWithRef, ReactNode } from "react";
import type { BaseTypeHelperFn, ProxyType } from "../../types";

export interface ImpressionProps {
  /** Minimum visible fraction, from 0 to 1. Defaults to 0.5. */
  ratio?: number;
  /** Required continuous visibility in milliseconds. Defaults to 1000. */
  duration?: number;
  root?: Element | null;
  rootMargin?: string;
  /** Called once the continuous visibility requirement is met. */
  onStart?: () => void;
  /** Called when a started exposure ends, including cleanup. */
  onEnd?: () => void;
  children?: ReactNode | ((isActive: boolean) => ReactNode);
}

interface ImpressionTypeHelper extends BaseTypeHelperFn {
  type: (props: ImpressionProps & Omit<this["props"], keyof ImpressionProps>) => ReactNode;
}

export type ImpressionType =
  ProxyType<ImpressionTypeHelper, "impression"> &
  ((props: ImpressionProps & Omit<ComponentPropsWithRef<"div">, keyof ImpressionProps>) => ReactNode);
