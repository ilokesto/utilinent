import { ComponentPropsWithRef, createElement, forwardRef } from "react";
import { htmlTags } from "../constants/htmlTags";
import type { ShowProps, ShowPropsArray, ShowType } from "../types/show";

const BaseShow = <T,>({ when, children, fallback = null }: ShowProps<T> | ShowPropsArray<T[]>) => {
  const shouldRender = Array.isArray(when) ? when.every(Boolean) : !!when;

  return shouldRender
    ? typeof children === "function"
      ? children(when as any)
      : children
    : fallback;
};

const renderForTag =
  (tag: any) =>
  // forward ref so consumers like Observer can pass a ref to the real DOM element
  forwardRef(function Render(
    { when, children, fallback = null, ...props }: (ShowProps<any> | ShowPropsArray<any[]>) & ComponentPropsWithRef<any>,
    ref: any
  ) {
    const shouldRender = Array.isArray(when) ? when.every(Boolean) : !!when;
    if (!shouldRender) return fallback;

    const content = typeof children === "function" ? children(when as any) : children;
    return createElement(tag, { ...props, ref }, content);
  });

const tagEntries = htmlTags.reduce((acc, tag) => {
  (acc as any)[tag] = renderForTag(tag);
  return acc;
}, {} as any);

export const Show = Object.assign(BaseShow, tagEntries) as unknown as ShowType;