function u({
  each: t,
  children: n,
  fallback: r = null
}) {
  return (t == null ? void 0 : t.length) !== 0 ? t.map(n) : r;
}
const y = ({ when: t, children: n, fallback: r = null }) => t ? n : r, i = ({ children: t }) => t;
function f({ children: t, when: n, fallback: r = null }) {
  return t.reduce((e, o) => {
    if (o.type !== i)
      throw new Error("Match 컴포넌트만 사용할 수 있습니다.");
    if (o.key) {
      if (e.includes(o.key))
        throw new Error(`Duplicate Match key: ${o.key}`);
      e.push(o.key);
    }
    return e;
  }, []), t.find((e) => e.key === n) ?? r;
}
export {
  u as Map,
  i as Match,
  y as Show,
  f as Switch
};
