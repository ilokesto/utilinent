import { ComponentPropsWithRef, createElement } from "react";
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

const htmlTags = [
  "a","abbr","address","article","aside","b","bdi","bdo","blockquote","button","canvas","cite","code","data","datalist","dd","del","details","dfn","dialog","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hr","i","img","input","ins","kbd","label","legend","li","main","map","mark","menu","meter","nav","ol","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","section","select","small","span","strong","sub","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","u","ul","var","video"
];

export const For = Object.assign(
  BaseFor,
  Object.fromEntries(htmlTags.map(tag => [tag, renderForTag(tag)]))
) as unknown as ForType;