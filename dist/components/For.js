export function For({ each, children, fallback = null, }) {
    return (each && each.length > 0) ? each?.map(children) : fallback;
}
