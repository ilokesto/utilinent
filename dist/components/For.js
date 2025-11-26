import { Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createElement, forwardRef } from "react";
import { htmlTags } from "../constants/htmlTags";
function BaseFor({ each, children, fallback = null, before, after, }) {
    const content = each && each.length > 0 ? each.map(children) : fallback;
    return (_jsxs(_Fragment, { children: [before, content, after] }));
}
const renderForTag = (tag) => 
// forward ref so consumers can attach a ref to the underlying DOM element
forwardRef(({ each, children, fallback = null, before, after, ...props }, ref) => {
    const content = each && each.length > 0 ? each.map(children) : fallback;
    return createElement(tag, { ...props, ref }, before, content, after);
});
const tagEntries = htmlTags.reduce((acc, tag) => {
    acc[tag] = renderForTag(tag);
    return acc;
}, {});
export const For = Object.assign(BaseFor, tagEntries);
