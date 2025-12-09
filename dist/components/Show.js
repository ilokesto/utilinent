import { createElement, forwardRef } from "react";
import { htmlTags } from "../constants/htmlTags";
import { PluginManager } from "../core/PluginManager";
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
    const content = shouldRender
        ? typeof children === "function"
            ? children(when)
            : children
        : fallback;
    return createElement(tag, { ...props, ref }, content);
});
// HTML 태그들을 등록
const tagEntries = htmlTags.reduce((acc, tag) => {
    acc[tag] = renderForTag(tag);
    return acc;
}, {});
export const Show = new Proxy(Object.assign(BaseShow, tagEntries), {
    get(target, prop) {
        // 기존 속성이 있으면 반환
        if (prop in target) {
            return target[prop];
        }
        // 플러그인에서 동적으로 조회
        const propName = String(prop);
        // 'show' 카테고리에서 먼저 찾기
        if (PluginManager.has('show', propName)) {
            const component = PluginManager.get('show', propName);
            const specialized = renderForTag(component);
            // 캐싱하여 다음 조회 시 동일한 참조 반환
            target[prop] = specialized;
            return specialized;
        }
        // 'base' 카테고리에서 찾기
        if (PluginManager.has('base', propName)) {
            const component = PluginManager.get('base', propName);
            const specialized = renderForTag(component);
            // 캐싱하여 다음 조회 시 동일한 참조 반환
            target[prop] = specialized;
            return specialized;
        }
        // 찾지 못하면 undefined 반환
        return undefined;
    }
});
