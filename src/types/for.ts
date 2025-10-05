import { ComponentPropsWithRef } from "react";
import { Fallback } from ".";

export interface ForProps<T extends Array<unknown>> extends Fallback {
  each: T | null | undefined; // 배열 또는 null/undefined 허용
  children: (item: T[number], index: number) => React.ReactNode;
}

type ForTagHelper<K extends keyof JSX.IntrinsicElements> = {
  <T extends Array<unknown>>(props: ForProps<T> & Omit<ComponentPropsWithRef<K>, 'children'>): React.ReactNode;
};

export interface ForType {
  <T extends Array<unknown>>(props: ForProps<T>): React.ReactNode;
  
  // 명시적으로 각 HTML 태그를 정의
  a: ForTagHelper<"a">;
  abbr: ForTagHelper<"abbr">;
  address: ForTagHelper<"address">;
  article: ForTagHelper<"article">;
  aside: ForTagHelper<"aside">;
  b: ForTagHelper<"b">;
  bdi: ForTagHelper<"bdi">;
  bdo: ForTagHelper<"bdo">;
  blockquote: ForTagHelper<"blockquote">;
  button: ForTagHelper<"button">;
  canvas: ForTagHelper<"canvas">;
  cite: ForTagHelper<"cite">;
  code: ForTagHelper<"code">;
  data: ForTagHelper<"data">;
  datalist: ForTagHelper<"datalist">;
  dd: ForTagHelper<"dd">;
  del: ForTagHelper<"del">;
  details: ForTagHelper<"details">;
  dfn: ForTagHelper<"dfn">;
  dialog: ForTagHelper<"dialog">;
  div: ForTagHelper<"div">;
  dl: ForTagHelper<"dl">;
  dt: ForTagHelper<"dt">;
  em: ForTagHelper<"em">;
  fieldset: ForTagHelper<"fieldset">;
  figcaption: ForTagHelper<"figcaption">;
  figure: ForTagHelper<"figure">;
  footer: ForTagHelper<"footer">;
  form: ForTagHelper<"form">;
  h1: ForTagHelper<"h1">;
  h2: ForTagHelper<"h2">;
  h3: ForTagHelper<"h3">;
  h4: ForTagHelper<"h4">;
  h5: ForTagHelper<"h5">;
  h6: ForTagHelper<"h6">;
  header: ForTagHelper<"header">;
  hr: ForTagHelper<"hr">;
  i: ForTagHelper<"i">;
  img: ForTagHelper<"img">;
  input: ForTagHelper<"input">;
  ins: ForTagHelper<"ins">;
  kbd: ForTagHelper<"kbd">;
  label: ForTagHelper<"label">;
  legend: ForTagHelper<"legend">;
  li: ForTagHelper<"li">;
  main: ForTagHelper<"main">;
  map: ForTagHelper<"map">;
  mark: ForTagHelper<"mark">;
  menu: ForTagHelper<"menu">;
  meter: ForTagHelper<"meter">;
  nav: ForTagHelper<"nav">;
  ol: ForTagHelper<"ol">;
  option: ForTagHelper<"option">;
  output: ForTagHelper<"output">;
  p: ForTagHelper<"p">;
  picture: ForTagHelper<"picture">;
  pre: ForTagHelper<"pre">;
  progress: ForTagHelper<"progress">;
  q: ForTagHelper<"q">;
  rp: ForTagHelper<"rp">;
  rt: ForTagHelper<"rt">;
  ruby: ForTagHelper<"ruby">;
  s: ForTagHelper<"s">;
  samp: ForTagHelper<"samp">;
  section: ForTagHelper<"section">;
  select: ForTagHelper<"select">;
  small: ForTagHelper<"small">;
  span: ForTagHelper<"span">;
  strong: ForTagHelper<"strong">;
  sub: ForTagHelper<"sub">;
  summary: ForTagHelper<"summary">;
  sup: ForTagHelper<"sup">;
  table: ForTagHelper<"table">;
  tbody: ForTagHelper<"tbody">;
  td: ForTagHelper<"td">;
  textarea: ForTagHelper<"textarea">;
  tfoot: ForTagHelper<"tfoot">;
  th: ForTagHelper<"th">;
  thead: ForTagHelper<"thead">;
  time: ForTagHelper<"time">;
  tr: ForTagHelper<"tr">;
  u: ForTagHelper<"u">;
  ul: ForTagHelper<"ul">;
  var: ForTagHelper<"var">;
  video: ForTagHelper<"video">;

  [x: string]: ForTagHelper<any>; // 임의의 태그도 허용
}
