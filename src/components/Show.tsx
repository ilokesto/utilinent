import { ComponentPropsWithRef, createElement, forwardRef } from "react";
import { createTagProxy } from "../core/createTagProxy";
import type { ShowProps, ShowPropsArray, ShowType } from "../types/show";
import { resolveWhen } from "../utils/resolveWhen";

const BaseShow = <T,>({ when, children, fallback = null }: ShowProps<T> | ShowPropsArray<T[]>) => {
  const shouldRender = resolveWhen(when);

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
    const content = BaseShow({ when, children, fallback });
    return createElement(tag, { ...props, ref }, content);
  });

export const Show = createTagProxy<ShowType, typeof BaseShow>(BaseShow, renderForTag, "show");
