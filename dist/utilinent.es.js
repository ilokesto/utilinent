import { jsx as s } from "react/jsx-runtime";
import { useState as l, useEffect as c } from "react";
function f({ when: t, children: n, fallback: u = null }) {
  return t ? typeof n == "function" ? n(t) : n : u;
}
function M({
  each: t,
  children: n,
  fallback: u = null
}) {
  return /* @__PURE__ */ s(f, { when: t && t.length > 0, fallback: u, children: t == null ? void 0 : t.map(n) });
}
function w({ children: t, element: n }) {
  return t ?? n;
}
function m({ children: t, when: n, fallback: u = null }) {
  return t.reduce((e, { type: o, props: r }) => {
    if (o !== w)
      throw new Error("Match 컴포넌트만 사용할 수 있습니다.");
    if (r.case) {
      if (e.includes(r.case))
        throw new Error(`Duplicate Match key: ${r.case}`);
      e.push(r.case);
    }
    return e;
  }, []), /* @__PURE__ */ s(f, { when: t.find(({ props: e }) => e.case === n), fallback: u, children: (e) => e });
}
function h({ children: t, fallback: n = null }) {
  const [u, e] = l(!1), [o, r] = l(null);
  return c(() => (e(!0), (async () => {
    if (typeof t == "function") {
      const i = await t();
      r(i);
    } else
      r(t);
  })(), () => {
    e(!1);
  }), [t]), /* @__PURE__ */ s(f, { when: u, fallback: n, children: o });
}
export {
  M as For,
  w as Match,
  h as Mount,
  f as Show,
  m as Switch
};
