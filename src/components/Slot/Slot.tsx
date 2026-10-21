import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { mergeProps } from './mergeProps';
import { isSlottable } from './Slottable';
import type { Props } from './types';
import { useComposedRef } from './useComposedRef';

/** Module-scoped so the guard works without Node types in this package. */
declare const process: { env: { NODE_ENV?: string } } | undefined;

function warnSlot(message: string): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn(`Slot: ${message}`);
  }
}

function childElementRef(element: ReactElement): Ref<HTMLElement> | undefined {
  return (element as ReactElement & { ref?: Ref<HTMLElement> }).ref;
}

function describeChild(child: ReactNode): string {
  if (typeof child === 'string') return 'a string child';
  if (typeof child === 'number') return 'a number child';
  if (Array.isArray(child)) return 'an array child';
  return 'a non-element child';
}

/**
 * Merges its props onto a single child element — Radix-style `asChild` pattern.
 *
 * Event handlers are chained, `className` strings are concatenated, and `style`
 * objects are shallow-merged. Refs are composed via a memoized callback that
 * stays referentially stable while the forwarded ref and the child ref keep
 * their identity.
 *
 * Children contract:
 * - Plain `Slot` expects exactly one element child. With multiple children only
 *   the first element receives the merged props and the remaining children are
 *   dropped; a non-element child renders `null`. Both cases warn in development.
 * - A {@link Slottable} child marks which descendant receives the merged props
 *   while its siblings render alongside it. An invalid slottable child renders
 *   nothing at its position, keeps its siblings rendered, and warns in
 *   development.
 */
export const Slot = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>((props, ref) => {
  const { children, ...slotProps } = props;
  const childrenArray = Children.toArray(children);
  const slottable = childrenArray.find(isSlottable);

  // The element that receives the merged props: the child inside Slottable,
  // or the first child of a plain Slot.
  const targetChild: ReactNode = slottable
    ? (slottable.props as { children?: ReactNode }).children
    : childrenArray[0];

  const targetRef = isValidElement(targetChild) ? childElementRef(targetChild) : undefined;
  const composedRef = useComposedRef(ref, targetRef);

  if (slottable) {
    if (!isValidElement(targetChild)) {
      warnSlot(
        'Slottable requires a single element child; it renders nothing at its position while its siblings still render.',
      );
      return <>{childrenArray.filter((child) => child !== slottable)}</>;
    }

    const newElement = cloneElement(
      targetChild,
      {
        ...mergeProps(slotProps, targetChild.props as Props),
        ref: composedRef,
        key: slottable.key,
      } as Props,
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
    if (childrenArray.length > 0) {
      warnSlot(`expected a single element child but received ${describeChild(child)}.`);
    }
    return null;
  }

  if (childrenArray.length > 1) {
    warnSlot(
      `expected a single child but received ${childrenArray.length}; merged props apply to the first element and the remaining children are dropped.`,
    );
  }

  return cloneElement(child, {
    ...mergeProps(slotProps, child.props as Props),
    ref: composedRef,
  } as Props);
});
