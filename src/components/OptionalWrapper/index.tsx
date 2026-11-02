import { Show } from "../Show";
import type { OptionalWrapperProps } from "./types";

/**
 * @description Conditionally wraps children in a `wrapper` function when `when` is truthy.
 *
 * When `when` is falsy, renders children directly — or through `elseWrapper`
 * when provided. `fallback` is accepted as a deprecated alias for `elseWrapper`.
 * Both wrapper expressions are evaluated during rendering; wrapper functions
 * should be pure even when their result is not selected.
 * @param {OptionalWrapperProps<T>} props - Conditional wrapping options.
 * @param {T} props.when - Condition evaluated by Show; arrays require nonempty, all-truthy elements.
 * @param {React.ReactNode} props.children - Content to wrap.
 * @param {(children: React.ReactNode) => React.ReactNode} props.wrapper - Truthy-branch wrapper.
 * @param {(children: React.ReactNode) => React.ReactNode} [props.elseWrapper] - Falsy-branch wrapper.
 * @param {(children: React.ReactNode) => React.ReactNode} [props.fallback] - Deprecated alias for elseWrapper.
 * @returns {React.ReactNode} The selected wrapper result or unwrapped children.
 *
 * @example
 * ```tsx
 * <OptionalWrapper when={isModal} wrapper={(c) => <Modal>{c}</Modal>}>
 *   <Content />
 * </OptionalWrapper>
 * ```
 */
export function OptionalWrapper<T>({
  when,
  children,
  wrapper,
  elseWrapper,
  fallback,
}: OptionalWrapperProps<T>): React.ReactNode {
  const elseFn = elseWrapper ?? fallback;
  return (
    <Show when={when} fallback={elseFn ? elseFn(children) : children}>
      {wrapper(children)}
    </Show>
  );
}
