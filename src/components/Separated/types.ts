import type { ReactNode } from "react";
import type { BaseTypeHelperFn, ProxyType } from "../../types";

/**
 * Props for {@link Separated}.
 *
 * `each` accepts mutable or readonly arrays.
 * `children` receives each item and its original index.
 * `by` is inserted between rendered nodes, excluding nullish and boolean results.
 */
export interface SeparatedProps<T extends ReadonlyArray<unknown>> {
  readonly each: T;
  readonly by: ReactNode;
  readonly children: (item: T[number], index: number) => ReactNode;
}

type BaseSeparatedType<X = object> = {
  <const T extends ReadonlyArray<unknown>>(props: X & SeparatedProps<T>): ReactNode;
};

interface BaseSeparatedTypeFn extends BaseTypeHelperFn {
  type: BaseSeparatedType<this["props"]>;
}

export type SeparatedType = ProxyType<BaseSeparatedTypeFn, "separated">;
