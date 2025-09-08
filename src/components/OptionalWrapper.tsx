import { OptionalWrapperProps } from "../types";
import { Show } from "./Show";

export function OptionalWrapper({
  when,
  children,
  wrapper,
}: OptionalWrapperProps): React.ReactNode {
  return <Show when={when} fallback={children}>
    {wrapper(children)}
  </Show>;
}