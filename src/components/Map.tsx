import type { MapProps } from "./types";

export function Map<T>({
  each,
  children,
  fallback = null,
}: MapProps<T>) {
  return each?.length !== 0 ? each.map(children) : fallback;
}
