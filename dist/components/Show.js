export function Show({ when, children, fallback = null }) {
    const shouldRender = Array.isArray(when) ? when.every(Boolean) : !!when;
    return shouldRender
        ? typeof children === "function"
            ? children(when)
            : children
        : fallback;
}
;
