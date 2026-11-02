import { createProxy } from "../../core/createProxy";
import { createTagRenderer } from "../../core/createTagRenderer";
import { resolveWhen } from "../../utils/resolveWhen";
import type { ShowProps, ShowPropsArray, ShowType } from "./types";

const BaseShow = <T,>({
  when,
  children,
  fallback = null,
}: ShowProps<T> | ShowPropsArray<T[]>) => {
  const shouldRender = resolveWhen(when);

  return shouldRender
    ? typeof children === "function"
      ? children(when as any)
      : children
    : fallback;
};

const renderForTag = createTagRenderer(
  BaseShow as (props: any) => React.ReactNode,
  ["when", "children", "fallback"],
  { fallback: null },
);

/**
 * @description Conditionally renders children when `when` is truthy.
 *
 * Supports a render-prop callback that receives the narrowed `NonNullable` value.
 * Polymorphic: access typed HTML tag variants via `Show.div`, `Show.span`, etc.,
 * and plugin-registered components via `Show.Link`, `Show.motionDiv`, etc.
 * Arrays must be nonempty with every element truthy.
 * @param {ShowProps<T> | ShowPropsArray<T[]>} props - Conditional rendering options.
 * @param {T | T[]} props.when - Scalar or array condition.
 * @param {React.ReactNode | Function} props.children - Content or renderer receiving the narrowed condition.
 * @param {React.ReactNode} [props.fallback] - Falsy-condition content; defaults to null.
 * @returns {React.ReactNode} Selected content, optionally inside a tag variant.
 *
 * @example
 * ```tsx
 * <Show when={user}>{(u) => <h1>Hello {u.name}</h1>}</Show>
 * <Show.div when={count > 0}>{count} items</Show.div>
 * ```
 */
export const Show: ShowType = createProxy(BaseShow, renderForTag, "show");
