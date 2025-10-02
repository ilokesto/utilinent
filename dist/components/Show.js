import { createElement } from "react";
const BaseShow = ({ when, children, fallback = null }) => {
    const shouldRender = Array.isArray(when) ? when.every(Boolean) : !!when;
    return shouldRender
        ? typeof children === "function"
            ? children(when)
            : children
        : fallback;
};
const renderForTag = (tag) => ({ when, children, fallback = null, ...props }) => {
    const shouldRender = Array.isArray(when) ? when.every(Boolean) : !!when;
    if (!shouldRender)
        return fallback;
    const content = typeof children === "function" ? children(when) : children;
    return createElement(tag, props, content);
};
const htmlTags = [
    "a", "abbr", "address", "article", "aside", "b", "bdi", "bdo", "blockquote", "button", "canvas", "cite", "code", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div", "dl", "dt", "em", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "menu", "meter", "nav", "ol", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "section", "select", "small", "span", "strong", "sub", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "tr", "u", "ul", "var", "video"
];
export const Show = Object.assign(BaseShow, Object.fromEntries(htmlTags.map(tag => [tag, renderForTag(tag)])));
