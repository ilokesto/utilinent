import type { ShowProps, ShowPropsArray } from "../types";

export function Show<T extends unknown[]>({ when, children, fallback }: ShowPropsArray<T>): React.ReactNode;
export function Show<T extends unknown>({ when, children, fallback }: ShowProps<T>): React.ReactNode;
export function Show<T,>({ when, children, fallback = null }: any): React.ReactNode {
  const shouldRender = Array.isArray(when) ? when.every(Boolean) : !!when;

  return shouldRender
    ? typeof children === "function"
      ? children(when as any)
      : children
    : fallback;
};