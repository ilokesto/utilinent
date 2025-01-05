import type { ForProps } from "./types";

export function For<T extends Array<unknown>>({
  each,
  children,
  fallback = null,
}: ForProps<T>) {
  return (each && each.length > 0) ? each?.map(children) : fallback;
}