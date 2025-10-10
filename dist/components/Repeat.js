import { jsx as _jsx } from "react/jsx-runtime";
import { createElement, forwardRef } from "react";
import { htmlTags } from "../constants/htmlTags";
import { For } from "./For";
function BaseRepeat({ times, children, fallback = null }) {
    if (!times || times <= 0 || !Number.isInteger(times)) {
        return fallback ?? null;
    }
    return _jsx(For, { each: Array.from({ length: times }, (_, i) => i), children: children });
}
const renderForTag = (tag) => 
// forward ref so consumers can attach a ref to the underlying DOM element
forwardRef(({ times, children, fallback = null, ...props }, ref) => {
    const content = times && times > 0 && Number.isInteger(times)
        ? Array.from({ length: times }, (_, i) => children(i))
        : fallback ?? null;
    return createElement(tag, { ...props, ref }, content);
});
const tagEntries = htmlTags.reduce((acc, tag) => {
    acc[tag] = renderForTag(tag);
    return acc;
}, {});
export const Repeat = Object.assign(BaseRepeat, tagEntries);
