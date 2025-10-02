import { createElement } from "react";
function BaseFor({ each, children, fallback = null, }) {
    return each && each.length > 0 ? each.map(children) : fallback;
}
const renderForTag = (tag) => ({ each, children, fallback = null, ...props }) => {
    if (!each || each.length === 0)
        return fallback;
    const content = each.map(children);
    return createElement(tag, props, content);
};
const htmlTags = [
    "a", "abbr", "address", "article", "aside", "b", "bdi", "bdo", "blockquote", "button", "canvas", "cite", "code", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div", "dl", "dt", "em", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "menu", "meter", "nav", "ol", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "section", "select", "small", "span", "strong", "sub", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "tr", "u", "ul", "var", "video"
];
export const For = Object.assign(BaseFor, Object.fromEntries(htmlTags.map(tag => [tag, renderForTag(tag)])));
