import { createElement, forwardRef } from "react";
import { htmlTags } from "../constants/htmlTags";
function BaseFor({ each, children, fallback = null, }) {
    return each && each.length > 0 ? each.map(children) : fallback;
}
const renderForTag = (tag) => 
// forward ref so consumers can attach a ref to the underlying DOM element
forwardRef(({ each, children, fallback = null, ...props }, ref) => {
    if (!each || each.length === 0)
        return fallback;
    const content = each.map(children);
    return createElement(tag, { ...props, ref }, content);
});
const tagEntries = htmlTags.reduce((acc, tag) => {
    acc[tag] = renderForTag(tag);
    return acc;
}, {});
export const For = Object.assign(BaseFor, tagEntries);
