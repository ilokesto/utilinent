import { useEffect, useState } from "react";
export function Mount({ children, fallback = null }) {
    const [resolvedChildren, setResolvedChildren] = useState(fallback);
    useEffect(() => {
        (async () => setResolvedChildren(typeof children === "function" ? await children() : children))();
    }, [children]);
    return resolvedChildren;
}
