import { ReactNode } from "./types";

export function OptionalWrapper({
  when,
  children,
  wrapper,
}:{ 
  when: boolean, 
  children: ReactNode, 
  wrapper: (children: ReactNode) => ReactNode}): ReactNode
{
  return when ? wrapper(children) : children;
}