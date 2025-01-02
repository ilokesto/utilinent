import type { ShowProps } from "./types";

export function Show({ when, children, fallback = null }: ShowProps) {
  return when ? children : fallback;
};