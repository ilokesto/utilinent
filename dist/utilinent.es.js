import { jsx as o } from "react/jsx-runtime";
import { useState as f, useEffect as i } from "react";
function h({
  each: t,
  children: e,
  fallback: r = null
}) {
  return t && t.length > 0 ? t.filter((n) => n != null).map(e) : r;
}
function l({ when: t, children: e, fallback: r = null }) {
  return t ? e : r;
}
function s({ children: t, element: e }) {
  return t ?? e;
}
function w({ children: t, when: e, fallback: r = null }) {
  return t.reduce((n, u) => {
    if (u.type !== s)
      throw new Error("Match 컴포넌트만 사용할 수 있습니다.");
    if (u.key) {
      if (n.includes(u.key))
        throw new Error(`Duplicate Match key: ${u.key}`);
      n.push(u.key);
    }
    return n;
  }, []), t.find((n) => n.key === e) ?? r;
}
function y({ children: t, fallback: e = null }) {
  const [r, n] = f(!1);
  return i(() => (n(!0), () => {
    n(!1);
  }), []), /* @__PURE__ */ o(l, { when: r, fallback: e, children: t });
}
export {
  h as Map,
  s as Match,
  y as Mount,
  l as Show,
  w as Switch
};
