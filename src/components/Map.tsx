import type { MapProps } from "./types";

export function Map<T extends Array<unknown>>({
  each,
  children,
  fallback = null,
}: MapProps<T>) {
  return (each && each.length > 0) ? each.map(children) : fallback;
}