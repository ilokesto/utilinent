import { ComponentPropsWithRef, createElement, forwardRef } from "react";
import { htmlTags } from "../constants/htmlTags";
import type { ForProps, ForType } from "../types/for";

function BaseFor<T extends Array<unknown>>({
  each,
  children,
  fallback = null,
}: ForProps<T>) {
  return <>{each && each.length > 0 ? each.map(children) : fallback}</>;
}

const renderForTag =
  (tag: any) =>
  // forward ref so consumers can attach a ref to the underlying DOM element
  forwardRef(<T extends Array<unknown>>(
    { each, children, fallback = null, ...props }: ForProps<T> & ComponentPropsWithRef<any>,
    ref: any
  ) => {
    const content = each && each.length > 0 ? each.map(children) : fallback;
    return createElement(tag, { ...props, ref }, content);
  });

const tagEntries = htmlTags.reduce((acc, tag) => {
  (acc as any)[tag] = renderForTag(tag);
  return acc;
}, {} as any);

export const For = Object.assign(BaseFor, tagEntries) as unknown as ForType;