import { jsx as f } from "react/jsx-runtime";
import { useState as s, useEffect as i } from "react";
function M({
  each: t,
  children: e,
  fallback: u = null
}) {
  return t && t.length > 0 ? t.map(e) : u;
}
function c({ when: t, children: e, fallback: u = null }) {
  return t ? typeof e == "function" ? e(t) : e : u;
}
function l({ children: t, element: e }) {
  return t ?? e;
}
function m({ children: t, when: e, fallback: u = null }) {
  return t.reduce((n, { type: o, props: r }) => {
    if (o !== l)
      throw new Error("Match 컴포넌트만 사용할 수 있습니다.");
    if (r.case) {
      if (n.includes(r.case))
        throw new Error(`Duplicate Match key: ${r.case}`);
      n.push(r.case);
    }
    return n;
  }, []), t.find(({ props: n }) => n.case === e) ?? u;
}
function h({ children: t, fallback: e = null }) {
  const [u, n] = s(!1);
  return i(() => (n(!0), () => {
    n(!1);
  }), []), /* @__PURE__ */ f(c, { when: u, fallback: e, children: t });
}
export {
  M as For,
  l as Match,
  h as Mount,
  c as Show,
  m as Switch
};
