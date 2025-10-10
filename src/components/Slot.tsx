import { Children, cloneElement, forwardRef, isValidElement, Ref } from 'react';

type Props = Record<string, any>;

function mergeProps(slotProps: Props, childProps: Props): Props {
  const merged = { ...childProps };

  for (const propName in slotProps) {
    const slotProp = slotProps[propName];
    const childProp = merged[propName];

    if (/^on[A-Z]/.test(propName) && typeof slotProp === 'function' && typeof childProp === 'function') {
      merged[propName] = (...args: any[]) => {
        childProp(...args);
        slotProp(...args);
      };
    } else if (propName === 'style' && typeof slotProp === 'object' && typeof childProp === 'object') {
      merged[propName] = { ...childProp, ...slotProp };
    } else if (propName === 'className' && typeof slotProp === 'string' && typeof childProp === 'string') {
      merged[propName] = [childProp, slotProp].filter(Boolean).join(' ');
    } else {
      merged[propName] = slotProp;
    }
  }

  return merged;
}

function composeRefs<T>(...refs: Ref<T>[]) {
    return (node: T) => {
      for (const ref of refs) {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref != null) {
          (ref as React.MutableRefObject<T>).current = node;
        }
      }
    };
  }

export const Slot = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>((props, ref) => {
  const { children, ...slotProps } = props;
  const childrenArray = Children.toArray(children);
  const slottable = childrenArray.find(isSlottable);

  if (slottable) {
    // Slottable의 children을 가져와서 병합
    const slottableChild = (slottable.props as any).children;
    
    if (!isValidElement(slottableChild)) {
      return null;
    }

    const newElement = cloneElement(
      slottableChild as any,
      {
        ...mergeProps(slotProps, (slottableChild as any).props),
        ref: ref ? composeRefs(ref, (slottableChild as any).ref) : (slottableChild as any).ref,
        key: (slottable as any).key
      } as any,
    );

    const newChildren = childrenArray.map((child) => {
      if (child === slottable) {
        return newElement;
      }
      return child;
    });

    return <>{newChildren}</>;
  }

  const [child] = childrenArray;

  if (!isValidElement(child)) {
    return null;
  }

  return cloneElement(child, {
    ...mergeProps(slotProps, child.props),
    ref: ref ? composeRefs(ref, (child as any).ref) : (child as any).ref
  });
});

function isSlottable(child: React.ReactNode): child is React.ReactElement {
  return isValidElement(child) && child.type === Slottable;
}

export const Slottable = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
