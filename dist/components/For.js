import { Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createElement, forwardRef } from "react";
import { htmlTags } from "../constants/htmlTags";
import { PluginManager } from "../core/PluginManager";
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
// HTML 태그들을 등록
const tagEntries = htmlTags.reduce((acc, tag) => {
    acc[tag] = renderForTag(tag);
    return acc;
}, {});
// Proxy를 사용하여 동적으로 플러그인 조회
export const For = new Proxy(Object.assign(BaseFor, tagEntries), {
    get(target, prop) {
        // 기존 속성이 있으면 반환
        if (prop in target) {
            return target[prop];
        }
        // 플러그인에서 동적으로 조회
        const propName = String(prop);
        // 'for' 카테고리에서 먼저 찾기
        if (PluginManager.has('for', propName)) {
            const component = PluginManager.get('for', propName);
            return renderForTag(component);
        }
        // 'base' 카테고리에서 찾기
        if (PluginManager.has('base', propName)) {
            const component = PluginManager.get('base', propName);
            return renderForTag(component);
        }
        // 찾지 못하면 undefined 반환
        return undefined;
    }
});
