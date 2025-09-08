import { Show } from "./Show";
import { OptionalWrapperProps } from "./types";

export function OptionalWrapper({
  when,
  children,
  wrapper,
}: OptionalWrapperProps): React.ReactNode {
  return <Show when={when} fallback={children}>
    {wrapper(children)}
  </Show>;
}