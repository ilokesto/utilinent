import { ComponentPropsWithRef, createElement } from "react";
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

const htmlTags = [
  "a","abbr","address","article","aside","b","bdi","bdo","blockquote","button","canvas","cite","code","data","datalist","dd","del","details","dfn","dialog","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hr","i","img","input","ins","kbd","label","legend","li","main","map","mark","menu","meter","nav","ol","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","section","select","small","span","strong","sub","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","u","ul","var","video"
];

export const Show = Object.assign(
  BaseShow,
  Object.fromEntries(htmlTags.map(tag => [tag, renderForTag(tag)]))
) as unknown as ShowType;