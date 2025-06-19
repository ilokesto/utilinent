export function Show({ when, children, fallback = null }) {
    return when ? typeof children === "function" ? children(when) : children : fallback;
}
;
