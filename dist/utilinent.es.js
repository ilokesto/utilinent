function u({
  each: t,
  children: r,
  fallback: e = null
}) {
  return t && t.length > 0 ? t.filter((n) => n != null).map(r) : e;
}
const l = ({ when: t, children: r, fallback: e = null }) => t ? r : e, i = ({ children: t }) => t;
function f({ children: t, when: r, fallback: e = null }) {
  return t.reduce((n, o) => {
    if (o.type !== i)
      throw new Error("Match 컴포넌트만 사용할 수 있습니다.");
    if (o.key) {
      if (n.includes(o.key))
        throw new Error(`Duplicate Match key: ${o.key}`);
      n.push(o.key);
    }
    return n;
  }, []), t.find((n) => n.key === r) ?? e;
}
export {
  u as Map,
  i as Match,
  l as Show,
  f as Switch
};
