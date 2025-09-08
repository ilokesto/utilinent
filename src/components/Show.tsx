import type { ShowProps } from "./types";

export function Show<T,>({ when, children, fallback = null }: ShowProps<T>) {
  return when
    ? typeof children === "function"
      ? children(when)
      : children
    : fallback;
};