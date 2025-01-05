import { Show } from "./Show";
import type { ForProps } from "./types";

export function For<T extends Array<unknown>>({
  each,
  children,
  fallback = null,
}: ForProps<T>) {

  return (
    <Show when={each && each.length > 0} fallback={fallback}>
      {each?.map(children)}
    </Show>
  );
}