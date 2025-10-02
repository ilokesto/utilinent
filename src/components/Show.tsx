import { ComponentPropsWithRef, createElement } from "react";
import { htmlTags } from "../constants/htmlTags";
import { ShowProps, ShowPropsArray } from "../types";

type ShowType = {
  <T extends unknown[]>(props: ShowPropsArray<T>): React.ReactNode;
  <T extends unknown>(props: ShowProps<T>): React.ReactNode;
} & {
  [K in keyof JSX.IntrinsicElements]: {
    <T extends unknown[]>(props: ShowPropsArray<T> & ComponentPropsWithRef<K>): React.ReactNode;
    <T extends unknown>(props: ShowProps<T> & ComponentPropsWithRef<K>): React.ReactNode;
  }
};

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
  ({ when, children, fallback = null, ...props }: (ShowProps<any> | ShowPropsArray<any[]>) & ComponentPropsWithRef<any>) => {
    const shouldRender = Array.isArray(when) ? when.every(Boolean) : !!when;
    if (!shouldRender) return fallback;

    const content = typeof children === "function" ? children(when as any) : children;
    return createElement(tag, props, content);
  };

export const Show = Object.assign(
  BaseShow,
  Object.fromEntries(htmlTags.map(tag => [tag, renderForTag(tag)]))
) as unknown as ShowType;