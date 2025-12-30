import { OptionalWrapperProps } from "../types";
import { Show } from "./Show";

export function OptionalWrapper<T>({
  when,
  children,
  wrapper,
  fallback
}: OptionalWrapperProps<T>): React.ReactNode {
  return <Show when={when} fallback={fallback ? fallback(children) : children}>
    {wrapper(children)}
  </Show>;
}
