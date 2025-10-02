import { ComponentPropsWithRef, createElement } from "react";
import { htmlTags } from "../constants/htmlTags";
import type { ForProps } from "../types";

type ForType = {
  <T extends Array<unknown>>(props: ForProps<T>): React.ReactNode;
} & {
  [K in keyof JSX.IntrinsicElements]: <T extends Array<unknown>>(
    props: ForProps<T> & ComponentPropsWithRef<K>
  ) => React.ReactNode;
};

function BaseFor<T extends Array<unknown>>({
  each,
  children,
  fallback = null,
}: ForProps<T>) {
  return each && each.length > 0 ? each.map(children) : fallback;
}

const renderForTag =
  (tag: any) =>
  <T extends Array<unknown>>({
    each,
    children,
    fallback = null,
    ...props
  }: ForProps<T> & ComponentPropsWithRef<any>) => {
    if (!each || each.length === 0) return fallback;
    const content = each.map(children);
    return createElement(tag, props, content);
  };

export const For = Object.assign(
  BaseFor,
  Object.fromEntries(htmlTags.map(tag => [tag, renderForTag(tag)]))
) as unknown as ForType;