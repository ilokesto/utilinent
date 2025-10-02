import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { createElement } from "react";
import { htmlTags } from "../constants/htmlTags";
function BaseRepeat({ times, children, fallback = null }) {
    if (!times || times <= 0 || !Number.isInteger(times)) {
        return fallback ?? null;
    }
    return _jsx(_Fragment, { children: Array.from({ length: times }, (_, i) => children(i)) });
}
const renderForTag = (tag) => ({ times, children, fallback = null, ...props }) => {
    if (!times || times <= 0 || !Number.isInteger(times)) {
        return fallback ?? null;
    }
    const content = Array.from({ length: times }, (_, i) => children(i));
    return createElement(tag, props, content);
};
const tagEntries = htmlTags.reduce((acc, tag) => {
    acc[tag] = renderForTag(tag);
    return acc;
}, {});
export const Repeat = Object.assign(BaseRepeat, tagEntries);
