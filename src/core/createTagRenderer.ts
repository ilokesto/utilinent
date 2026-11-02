import { createElement, forwardRef } from "react";

/**
 * @description Creates a tag-wrapper factory for {@link createProxy}.
 *
 * Props listed in `baseKeys` are routed to `renderBase`; all remaining props
 * are spread onto the HTML tag. `defaults` fills in missing base prop values.
 *
 * @param {(props: TProps) => React.ReactNode} renderBase - Renders the component-owned props.
 * @param {readonly string[]} baseKeys - Names of props consumed by the base renderer instead of the wrapper.
 * @param {Partial<TProps>} [defaults] - Values used when a component-owned prop is undefined.
 * @returns {(tag: React.ElementType) => React.ForwardRefExoticComponent<any>} A factory that creates a ref-forwarding wrapper for a tag or registered component.
 * @example
 * ```tsx
 * const renderForTag = createTagRenderer(
 *   ({ children }: { children?: React.ReactNode }) => children,
 *   ["children"],
 * );
 * const Section = renderForTag("section");
 * const content = <Section title="Details">Content</Section>;
 * ```
 */
export function createTagRenderer<TProps extends Record<string, any>>(
  renderBase: (props: TProps) => React.ReactNode,
  baseKeys: readonly string[],
  defaults: Partial<TProps> = {},
) {
  return (tag: React.ElementType) =>
    forwardRef<any, any>(function Tagged(props: any, ref: any) {
      const baseProps: Record<string, any> = {};
      const tagProps: Record<string, any> = {};

      for (const key of Object.keys(props)) {
        if (baseKeys.includes(key)) {
          baseProps[key] = props[key];
        } else {
          tagProps[key] = props[key];
        }
      }

      for (const key of Object.keys(defaults)) {
        if (baseProps[key] === undefined) {
          baseProps[key] = (defaults as Record<string, any>)[key];
        }
      }

      const content = renderBase(baseProps as TProps);
      return createElement(tag, { ...tagProps, ref }, content);
    });
}
