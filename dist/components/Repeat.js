import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
export function Repeat({ times, children, fallback }) {
    // times가 0 이하이거나 유효하지 않은 경우 fallback 렌더링
    if (!times || times <= 0 || !Number.isInteger(times)) {
        return fallback || null;
    }
    return (_jsx(_Fragment, { children: Array.from({ length: times }, (_, index) => children(index)) }));
}
