import { jsx as _jsx } from "react/jsx-runtime";
import { Show } from "./Show";
export function OptionalWrapper({ when, children, wrapper, fallback }) {
    return _jsx(Show, { when: when, fallback: fallback ? fallback(children) : children, children: wrapper(children) });
}
