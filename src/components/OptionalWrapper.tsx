import { Show } from "./Show";
import { ReactNode } from "./types";

export function OptionalWrapper({
  when,
  children,
  wrapper,
}: {
  when: boolean, 
  children: ReactNode, 
  wrapper: (children: ReactNode) => ReactNode
}): ReactNode {
  return <Show when={when} fallback={children}>
    {wrapper(children)}
  </Show>;
}