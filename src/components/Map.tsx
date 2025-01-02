import type { MapProps } from "./types";

export function Map<T>({
  each,
  children,
  fallback = null,
}: MapProps<T>) {
  return (each && each.length > 0) ? each.filter((item): item is NonNullable<T> => item != null).map(children) : fallback;
}