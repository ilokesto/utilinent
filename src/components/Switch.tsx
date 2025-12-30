import {
  Children,
  ComponentPropsWithRef,
  Fragment,
  createElement,
  forwardRef,
  isValidElement,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { createTagProxy } from "../core/createTagProxy";
import type { MatchProps, SwitchProps, SwitchType } from "../types/switch";
import { resolveWhen } from "../utils/resolveWhen";

const flattenChildren = (nodes: ReactNode): ReactNode[] =>
  Children.toArray(nodes).flatMap((child) => {
    if (isValidElement(child) && child.type === Fragment) {
      return flattenChildren(child.props.children);
    }
    return [child];
  });

const isMatchElement = (child: ReactNode): child is ReactElement<MatchProps> =>
  isValidElement(child) && child.type === Match;

function BaseSwitch({ children, fallback = null }: SwitchProps) {
  const childArray = flattenChildren(children);

  for (const child of childArray) {
    if (!isMatchElement(child)) {
      continue;
    }

    const { when } = child.props;
    if (!resolveWhen(when)) {
      continue;
    }

    return child;
  }

  return fallback;
}

const renderForTag =
  (tag: any) =>
  // forward ref so consumers can attach a ref to the underlying DOM element
  forwardRef(function Render(
    { children, fallback = null, ...props }: SwitchProps & ComponentPropsWithRef<any>,
    ref: any
  ) {
    return createElement(
      tag,
      { ...props, ref },
      <BaseSwitch fallback={fallback}>{children}</BaseSwitch>
    );
  });

export const Switch = createTagProxy<SwitchType, typeof BaseSwitch>(BaseSwitch, renderForTag, "switch");

export function Match<T>({ when, children }: MatchProps<T>) {
  if (!resolveWhen(when)) {
    return null;
  }

  return typeof children === "function"
    ? (children as (value: NonNullable<T>) => ReactNode)(when as NonNullable<T>)
    : children;
}
