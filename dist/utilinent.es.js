import { useState as f, useEffect as i } from "react";
function a({
  each: t,
  children: n,
  fallback: u = null
}) {
  return t && t.length > 0 ? t == null ? void 0 : t.map(n) : u;
}
function c({ when: t, children: n, fallback: u = null }) {
  return t ? typeof n == "function" ? n(t) : n : u;
}
function s({ children: t, element: n }) {
  return t ?? n;
}
function w({ children: t, when: n, fallback: u = null }) {
  return t.reduce((e, { type: r, props: o }) => {
    if (r !== s)
      throw new Error("Match 컴포넌트만 사용할 수 있습니다.");
    if (o.case) {
      if (e.includes(o.case))
        throw new Error(`Duplicate Match key: ${o.case}`);
      e.push(o.case);
    }
    return e;
  }, []), t.find(({ props: e }) => e.case === n) ?? u;
}
function y({ children: t, fallback: n = null }) {
  const [u, e] = f(n);
  return i(() => {
    (async () => e(typeof t == "function" ? await t() : t))();
  }, [t]), u;
}
export {
  a as For,
  s as Match,
  y as Mount,
  c as Show,
  w as Switch
};
