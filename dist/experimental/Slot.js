import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { Children, cloneElement, forwardRef, isValidElement } from 'react';
function mergeProps(slotProps, childProps) {
    const merged = { ...childProps };
    for (const propName in slotProps) {
        const slotProp = slotProps[propName];
        const childProp = merged[propName];
        if (/^on[A-Z]/.test(propName) && typeof slotProp === 'function' && typeof childProp === 'function') {
            merged[propName] = (...args) => {
                childProp(...args);
                slotProp(...args);
            };
        }
        else if (propName === 'style' && typeof slotProp === 'object' && typeof childProp === 'object') {
            merged[propName] = { ...childProp, ...slotProp };
        }
        else if (propName === 'className' && typeof slotProp === 'string' && typeof childProp === 'string') {
            merged[propName] = [childProp, slotProp].filter(Boolean).join(' ');
        }
        else {
            merged[propName] = slotProp;
        }
    }
    return merged;
}
function composeRefs(...refs) {
    return (node) => {
        for (const ref of refs) {
            if (typeof ref === 'function') {
                ref(node);
            }
            else if (ref != null) {
                ref.current = node;
            }
        }
    };
}
export const Slot = forwardRef((props, ref) => {
    const { children, ...slotProps } = props;
    const childrenArray = Children.toArray(children);
    const slottable = childrenArray.find(isSlottable);
    if (slottable) {
        const newElement = cloneElement(slottable, {
            ...mergeProps(slotProps, slottable.props),
            ref: composeRefs(ref, slottable.ref)
        });
        const newChildren = childrenArray.map((child) => {
            if (child === slottable) {
                return newElement;
            }
            return child;
        });
        return _jsx(_Fragment, { children: newChildren });
    }
    const [child] = childrenArray;
    if (!isValidElement(child)) {
        return null;
    }
    return cloneElement(child, {
        ...mergeProps(slotProps, child.props),
        ref: composeRefs(ref, child.ref)
    });
});
function isSlottable(child) {
    return isValidElement(child) && child.type === Slottable;
}
export const Slottable = ({ children }) => {
    return _jsx(_Fragment, { children: children });
};
