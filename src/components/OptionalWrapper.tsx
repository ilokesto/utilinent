import { OptionalWrapperProps } from "../types";
import { Show } from "./Show";

export function OptionalWrapper({
  when,
  children,
  wrapper,
  fallback
}: OptionalWrapperProps): React.ReactNode {
  return <Show when={when} fallback={fallback ? fallback(children) : children}>
    {wrapper(children)}
  </Show>;
}