import { isValidElement } from "react";
import type { NonNullableElements } from "../../types";
import { resolveWhen } from "../../utils/resolveWhen";
import type { MatchProps, MatchPropsArray } from "./types";

type MatchChildValue<T> = T extends readonly unknown[] ? NonNullableElements<T> : NonNullable<T>;
type MatchElementProps = MatchProps | MatchPropsArray<readonly unknown[]>;

/**
 * @description A condition case for {@link Switch}.
 *
 * Renders children when `when` is truthy; returns `null` otherwise.
 * Supports a render-prop callback that receives the narrowed value.
 * Arrays must be nonempty with all elements truthy.
 * @param {MatchProps<T> | MatchPropsArray<readonly unknown[]>} props - Case options.
 * @param {T | readonly unknown[]} props.when - Scalar or array condition.
 * @param {React.ReactNode | Function} props.children - Content or narrowed-condition renderer.
 * @returns {React.ReactNode} Rendered children for a matching case, otherwise null.
 *
 * @example
 * ```tsx
 * <Match when={user}>{(u) => <h1>Hello {u.name}</h1>}</Match>
 * ```
 */
export function Match<const T extends readonly unknown[]>(props: MatchPropsArray<T>): React.ReactNode;
export function Match<T>(props: MatchProps<T>): React.ReactNode;
/**
 * @description Implements scalar and array Match cases using the shared truthiness rules.
 * @param {MatchProps<T> | MatchPropsArray<readonly unknown[]>} props - Case options.
 * @param {T | readonly unknown[]} props.when - Scalar or array condition.
 * @param {React.ReactNode | Function} props.children - Content or narrowed-condition renderer.
 * @returns {React.ReactNode} Matching content or null.
 * @example
 * ```tsx
 * <Match when={ready}><Content /></Match>
 * ```
 */
export function Match<T>({ when, children }: MatchProps<T> | MatchPropsArray<readonly unknown[]>) {
  if (!resolveWhen(when)) {
    return null;
  }

  return typeof children === "function"
    ? (children as (value: MatchChildValue<typeof when>) => React.ReactNode)(
        when as MatchChildValue<typeof when>
      )
    : children;
}

/**
 * @description Tests whether a node is a Match element without evaluating its condition.
 * @param {React.ReactNode} child - Node to inspect.
 * @returns {boolean} Whether the node is a Match React element.
 * @example
 * ```tsx
 * isMatchElement(<Match when={true}>Ready</Match>); // true
 * ```
 */
export const isMatchElement = (child: React.ReactNode): child is React.ReactElement<MatchElementProps> =>
  isValidElement(child) && child.type === Match;
