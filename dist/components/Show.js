import { createElement, forwardRef } from "react";
import { htmlTags } from "../constants/htmlTags";
const BaseShow = ({ when, children, fallback = null }) => {
    const shouldRender = Array.isArray(when) ? when.every(Boolean) : !!when;
    return shouldRender
        ? typeof children === "function"
            ? children(when)
            : children
        : fallback;
};
const renderForTag = (tag) => 
// forward ref so consumers like Observer can pass a ref to the real DOM element
forwardRef(function Render({ when, children, fallback = null, ...props }, ref) {
    const shouldRender = Array.isArray(when) ? when.every(Boolean) : !!when;
    if (!shouldRender)
        return fallback;
    const content = typeof children === "function" ? children(when) : children;
    return createElement(tag, { ...props, ref }, content);
});
const tagEntries = htmlTags.reduce((acc, tag) => {
    acc[tag] = renderForTag(tag);
    return acc;
}, {});
export const Show = Object.assign(BaseShow, tagEntries);
