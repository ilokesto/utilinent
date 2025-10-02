import { ComponentPropsWithRef } from "react";
import { Fallback } from ".";

export interface RepeatProps extends Fallback {
  times: number; 
  children: (index: number) => React.ReactNode; 
}

type RepeatTagHelper<K extends keyof JSX.IntrinsicElements> = {
  (props: RepeatProps & ComponentPropsWithRef<K>): React.ReactNode;
};

export interface RepeatType {
  (props: RepeatProps): React.ReactNode;
  
  // 명시적으로 각 HTML 태그를 정의
  a: RepeatTagHelper<"a">;
  abbr: RepeatTagHelper<"abbr">;
  address: RepeatTagHelper<"address">;
  article: RepeatTagHelper<"article">;
  aside: RepeatTagHelper<"aside">;
  b: RepeatTagHelper<"b">;
  bdi: RepeatTagHelper<"bdi">;
  bdo: RepeatTagHelper<"bdo">;
  blockquote: RepeatTagHelper<"blockquote">;
  button: RepeatTagHelper<"button">;
  canvas: RepeatTagHelper<"canvas">;
  cite: RepeatTagHelper<"cite">;
  code: RepeatTagHelper<"code">;
  data: RepeatTagHelper<"data">;
  datalist: RepeatTagHelper<"datalist">;
  dd: RepeatTagHelper<"dd">;
  del: RepeatTagHelper<"del">;
  details: RepeatTagHelper<"details">;
  dfn: RepeatTagHelper<"dfn">;
  dialog: RepeatTagHelper<"dialog">;
  div: RepeatTagHelper<"div">;
  dl: RepeatTagHelper<"dl">;
  dt: RepeatTagHelper<"dt">;
  em: RepeatTagHelper<"em">;
  fieldset: RepeatTagHelper<"fieldset">;
  figcaption: RepeatTagHelper<"figcaption">;
  figure: RepeatTagHelper<"figure">;
  footer: RepeatTagHelper<"footer">;
  form: RepeatTagHelper<"form">;
  h1: RepeatTagHelper<"h1">;
  h2: RepeatTagHelper<"h2">;
  h3: RepeatTagHelper<"h3">;
  h4: RepeatTagHelper<"h4">;
  h5: RepeatTagHelper<"h5">;
  h6: RepeatTagHelper<"h6">;
  header: RepeatTagHelper<"header">;
  hr: RepeatTagHelper<"hr">;
  i: RepeatTagHelper<"i">;
  img: RepeatTagHelper<"img">;
  input: RepeatTagHelper<"input">;
  ins: RepeatTagHelper<"ins">;
  kbd: RepeatTagHelper<"kbd">;
  label: RepeatTagHelper<"label">;
  legend: RepeatTagHelper<"legend">;
  li: RepeatTagHelper<"li">;
  main: RepeatTagHelper<"main">;
  map: RepeatTagHelper<"map">;
  mark: RepeatTagHelper<"mark">;
  menu: RepeatTagHelper<"menu">;
  meter: RepeatTagHelper<"meter">;
  nav: RepeatTagHelper<"nav">;
  ol: RepeatTagHelper<"ol">;
  option: RepeatTagHelper<"option">;
  output: RepeatTagHelper<"output">;
  p: RepeatTagHelper<"p">;
  picture: RepeatTagHelper<"picture">;
  pre: RepeatTagHelper<"pre">;
  progress: RepeatTagHelper<"progress">;
  q: RepeatTagHelper<"q">;
  rp: RepeatTagHelper<"rp">;
  rt: RepeatTagHelper<"rt">;
  ruby: RepeatTagHelper<"ruby">;
  s: RepeatTagHelper<"s">;
  samp: RepeatTagHelper<"samp">;
  section: RepeatTagHelper<"section">;
  select: RepeatTagHelper<"select">;
  small: RepeatTagHelper<"small">;
  span: RepeatTagHelper<"span">;
  strong: RepeatTagHelper<"strong">;
  sub: RepeatTagHelper<"sub">;
  summary: RepeatTagHelper<"summary">;
  sup: RepeatTagHelper<"sup">;
  table: RepeatTagHelper<"table">;
  tbody: RepeatTagHelper<"tbody">;
  td: RepeatTagHelper<"td">;
  textarea: RepeatTagHelper<"textarea">;
  tfoot: RepeatTagHelper<"tfoot">;
  th: RepeatTagHelper<"th">;
  thead: RepeatTagHelper<"thead">;
  time: RepeatTagHelper<"time">;
  tr: RepeatTagHelper<"tr">;
  u: RepeatTagHelper<"u">;
  ul: RepeatTagHelper<"ul">;
  var: RepeatTagHelper<"var">;
  video: RepeatTagHelper<"video">;

  [x: string]: RepeatTagHelper<any>; // 임의의 태그도 허용
}
