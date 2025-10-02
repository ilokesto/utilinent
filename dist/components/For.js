import { createElement } from "react";
import { htmlTags } from "../constants/htmlTags";
function BaseFor({ each, children, fallback = null, }) {
    return each && each.length > 0 ? each.map(children) : fallback;
}
const renderForTag = (tag) => ({ each, children, fallback = null, ...props }) => {
    if (!each || each.length === 0)
        return fallback;
    const content = each.map(children);
    return createElement(tag, props, content);
};
export const For = Object.assign(BaseFor, Object.fromEntries(htmlTags.map(tag => [tag, renderForTag(tag)])));
