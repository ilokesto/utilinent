import { jsx as _jsx } from "react/jsx-runtime";
import { createElement, forwardRef } from "react";
import { htmlTags } from "../constants/htmlTags";
import { PluginManager } from "../core/PluginManager";
import { For } from "./For";
function BaseRepeat({ times, children, fallback = null }) {
    if (!times || times <= 0 || !Number.isInteger(times)) {
        return fallback ?? null;
    }
    return _jsx(For, { each: Array.from({ length: times }, (_, i) => i), children: children });
}
const renderForTag = (tag) => 
// forward ref so consumers can attach a ref to the underlying DOM element
forwardRef(({ times, children, fallback = null, ...props }, ref) => {
    const content = times && times > 0 && Number.isInteger(times)
        ? Array.from({ length: times }, (_, i) => children(i))
        : fallback ?? null;
    return createElement(tag, { ...props, ref }, content);
});
// HTML 태그들을 등록
const tagEntries = htmlTags.reduce((acc, tag) => {
    acc[tag] = renderForTag(tag);
    return acc;
}, {});
export const Repeat = new Proxy(Object.assign(BaseRepeat, tagEntries), {
    get(target, prop) {
        // 기존 속성이 있으면 반환
        if (prop in target) {
            return target[prop];
        }
        // 플러그인에서 동적으로 조회
        const propName = String(prop);
        // 'repeat' 카테고리에서 먼저 찾기
        if (PluginManager.has('repeat', propName)) {
            const component = PluginManager.get('repeat', propName);
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
