import { ComponentPropsWithRef, createElement } from "react";
import { htmlTags } from "../constants/htmlTags";
import { ShowProps, ShowPropsArray } from "../types";

type ShowTagHelper<K extends keyof JSX.IntrinsicElements> = {
  <T extends unknown>(props: ShowProps<T> & ComponentPropsWithRef<K>): React.ReactNode;
  <T extends unknown[]>(props: ShowPropsArray<T> & ComponentPropsWithRef<K>): React.ReactNode;
};

interface ShowType {
  <T extends unknown>(props: ShowProps<T>): React.ReactNode;
  <T extends unknown[]>(props: ShowPropsArray<T>): React.ReactNode;
  
  // 명시적으로 각 HTML 태그를 정의
  div: ShowTagHelper<"div">;
  span: ShowTagHelper<"span">;
  h1: ShowTagHelper<"h1">;
  h2: ShowTagHelper<"h2">;
  h3: ShowTagHelper<"h3">;
  h4: ShowTagHelper<"h4">;
  h5: ShowTagHelper<"h5">;
  h6: ShowTagHelper<"h6">;
  p: ShowTagHelper<"p">;
  a: ShowTagHelper<"a">;
  button: ShowTagHelper<"button">;
  section: ShowTagHelper<"section">;
  article: ShowTagHelper<"article">;
  header: ShowTagHelper<"header">;
  footer: ShowTagHelper<"footer">;
  nav: ShowTagHelper<"nav">;
  main: ShowTagHelper<"main">;
  aside: ShowTagHelper<"aside">;
  ul: ShowTagHelper<"ul">;
  ol: ShowTagHelper<"ol">;
  li: ShowTagHelper<"li">;
  label: ShowTagHelper<"label">;
  input: ShowTagHelper<"input">;
  textarea: ShowTagHelper<"textarea">;
  select: ShowTagHelper<"select">;
  form: ShowTagHelper<"form">;
  table: ShowTagHelper<"table">;
  thead: ShowTagHelper<"thead">;
  tbody: ShowTagHelper<"tbody">;
  tfoot: ShowTagHelper<"tfoot">;
  tr: ShowTagHelper<"tr">;
  th: ShowTagHelper<"th">;
  td: ShowTagHelper<"td">;
  img: ShowTagHelper<"img">;
  video: ShowTagHelper<"video">;
  canvas: ShowTagHelper<"canvas">;
  // 나머지 태그들은 인덱스 시그니처로 처리
  [K: string]: ShowTagHelper<any>;
}

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

const tagEntries = htmlTags.reduce((acc, tag) => {
  (acc as any)[tag] = renderForTag(tag);
  return acc;
}, {} as any);

export const Show = Object.assign(BaseShow, tagEntries) as unknown as ShowType;