import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { createElement, forwardRef } from "react";
import { htmlTags } from "../constants/htmlTags";
function BaseRepeat({ times, children, fallback = null }) {
    if (!times || times <= 0 || !Number.isInteger(times)) {
        return fallback ?? null;
    }
    return _jsx(_Fragment, { children: Array.from({ length: times }, (_, i) => children(i)) });
}
const renderForTag = (tag) => 
// forward ref so consumers can attach a ref to the underlying DOM element
forwardRef(({ times, children, fallback = null, ...props }, ref) => {
    if (!times || times <= 0 || !Number.isInteger(times)) {
        return fallback ?? null;
    }
    const content = Array.from({ length: times }, (_, i) => children(i));
    return createElement(tag, { ...props, ref }, content);
});
const tagEntries = htmlTags.reduce((acc, tag) => {
    acc[tag] = renderForTag(tag);
    return acc;
}, {});
export const Repeat = Object.assign(BaseRepeat, tagEntries);
