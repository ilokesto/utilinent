import { htmlTags } from "../constants/htmlTags";
import type { RegistryCategory } from "../types";
import { PluginManager } from "./PluginManager";

/**
 * Creates a polymorphic proxy component with typed HTML tag variants.
 *
 * The returned proxy exposes every HTML tag in {@link htmlTags} as a property
 * (e.g. `Show.div`, `Show.span`), each rendering the base component's output
 * through the corresponding tag. Plugin-registered components are resolved
 * lazily via {@link PluginManager} on first access.
 *
 * @param base - the base render function or component
 * @param renderForTag - factory that wraps the base in a `forwardRef` element for a given tag
 * @param category - plugin registry category for this component
 */
export function createProxy<TProxy extends object, TBase extends object = TProxy>(
  base: TBase,
  renderForTag: (tag: any) => React.ForwardRefExoticComponent<any>,
  category: RegistryCategory
): TProxy {
  const tagEntries = Object.keys(htmlTags).reduce((acc, tag) => {
    (acc as any)[tag] = renderForTag(tag);
    return acc;
  }, {} as Record<string, any>);

  const target = Object.assign(base, tagEntries) as TBase & Record<string, any>;

  return new Proxy(target, {
    get(currentTarget, prop) {
      if (prop in currentTarget) {
        return (currentTarget as any)[prop];
      }

      const propName = String(prop);

      let pluginCategory = category;
      if (!PluginManager.has(pluginCategory, propName)) {
        pluginCategory = "base";
        if (!PluginManager.has(pluginCategory, propName)) {
          return undefined;
        }
      }

      const component = PluginManager.get(pluginCategory, propName);
      const specialized = renderForTag(component);
      (currentTarget as any)[prop] = specialized;
      return specialized;
    },
  }) as TProxy;
}
