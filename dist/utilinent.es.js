import { useState as s, useEffect as l } from "react";
function c({
  each: t,
  children: n,
  fallback: u = null
}) {
  return t && t.length > 0 ? t == null ? void 0 : t.map(n) : u;
}
function w({ when: t, children: n, fallback: u = null }) {
  return t ? typeof n == "function" ? n(t) : n : u;
}
function i({ children: t, element: n }) {
  return t ?? n;
}
function M({ children: t, when: n, fallback: u = null }) {
  return t.reduce((e, { type: r, props: o }) => {
    if (r !== i)
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
  const [u, e] = s(!1), [r, o] = s(null);
  return l(() => (e(!0), (async () => {
    if (typeof t == "function") {
      const f = await t();
      o(f);
    } else
      o(t);
  })(), () => {
    e(!1);
  }), [t]), u ? r : n;
}
export {
  c as For,
  i as Match,
  y as Mount,
  w as Show,
  M as Switch
};
