import { ComponentPropsWithRef, createElement } from "react";
import { htmlTags } from "../constants/htmlTags";
import type { ForProps, ForType } from "../types/for";

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

const tagEntries = htmlTags.reduce((acc, tag) => {
  (acc as any)[tag] = renderForTag(tag);
  return acc;
}, {} as any);

export const For = Object.assign(BaseFor, tagEntries) as unknown as ForType;