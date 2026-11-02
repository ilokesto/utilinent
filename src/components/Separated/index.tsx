import { Children, Fragment, isValidElement } from "react";
import { createProxy } from "../../core/createProxy";
import { createTagRenderer } from "../../core/createTagRenderer";
import type { SeparatedProps, SeparatedType } from "./types";

function BaseSeparated<T extends ReadonlyArray<unknown>>({
  each,
  by,
  children,
}: SeparatedProps<T>) {
  const nodes = Children.toArray(each.map((item, index) => children(item, index)));

  return nodes.map((node, index) => (
    <Fragment key={isValidElement(node) ? node.key : index}>
      {index > 0 ? by : null}
      {node}
    </Fragment>
  ));
}

const renderSeparatedTag = createTagRenderer(
  BaseSeparated<ReadonlyArray<unknown>>,
  ["each", "by", "children"],
);

/**
 * Renders items with `by` between their rendered nodes, without a wrapper.
 *
 * Nullish and boolean results are omitted. Arrays are flattened; fragments and
 * components remain opaque. Keyed elements retain their identity across updates.
 * Polymorphic: access typed HTML tag variants via `Separated.div`, etc.
 *
 * @example
 * ```tsx
 * <Separated each={["hello", "react", "world"]} by={<hr />}>
 *   {(item) => <div key={item}>{item}</div>}
 * </Separated>
 * ```
 */
export const Separated: SeparatedType = createProxy(
  BaseSeparated,
  renderSeparatedTag,
  "separated",
);

export type { SeparatedProps, SeparatedType } from "./types";
