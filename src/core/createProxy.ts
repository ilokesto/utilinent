import { htmlTags } from "../constants/htmlTags";
import type { RegistryCategory } from "../types";
import { PluginManager } from "./PluginManager";

/**
 * @description Creates a polymorphic proxy component with typed HTML tag variants.
 *
 * The returned proxy resolves every tag in {@link htmlTags} (e.g.
 * `Show.div`, `Show.span`) on first access and caches the wrapper on the
 * proxy target, so evaluating the proxy allocates nothing until a tag
 * variant is actually read. Plugin-registered components are resolved
 * lazily via {@link PluginManager} on first access and cached the same way.
 *
 * Reflection keeps reporting every tag as if it were an own property:
 * `in`, `Object.keys` and enumeration still list all tags, and
 * `Object.getOwnPropertyDescriptor` materializes the wrapper on demand so
 * the reported value always matches property access.
 *
 * @param {TBase} base - The base render function or component.
 * @param {(tag: React.ElementType) => React.ForwardRefExoticComponent<any>} renderForTag - Creates a ref-forwarding wrapper for an HTML tag or registered component.
 * @param {RegistryCategory} category - The plugin category checked before the shared base category.
 * @returns {TProxy} The callable base component with lazily resolved, cached tag and plugin variants.
 * @example
 * ```tsx
 * import * as React from "react";
 * import { createProxy } from "@ilokesto/utilinent";
 *
 * const Base = ({ children }: { children?: React.ReactNode }) => children;
 * const Content = createProxy<typeof Base>(
 *   Base,
 *   (tag) => React.forwardRef<HTMLElement, { children?: React.ReactNode }>(
 *     (props, ref) => React.createElement(tag, { ...props, ref }),
 *   ),
 *   "base",
 * );
 * const content = <Content>Details</Content>;
 * ```
 */
export function createProxy<TProxy extends object, TBase extends object = TProxy>(
  base: TBase,
  renderForTag: (tag: any) => React.ForwardRefExoticComponent<any>,
  category: RegistryCategory
): TProxy {
  const target = base as TBase & Record<string, any>;

  const tagNames = Object.keys(htmlTags);
  // Own keys of the base at proxy creation. The ownKeys trap replays them
  // first so enumeration order matches the previous eager implementation.
  const isBaseKey = new Set(Reflect.ownKeys(target));

  // Tag slots whose value has been observed (materialized, assigned or
  // deleted). Untouched slots stay virtual: listed by the traps but never
  // allocated. A touched slot behaves exactly like a plain own property, so
  // deleting `proxy.div` keeps returning undefined instead of recreating a
  // wrapper on the next read.
  const touchedTags = new Set<string>();

  const isHtmlTag = (prop: string | symbol): prop is string =>
    typeof prop === "string" &&
    Object.prototype.hasOwnProperty.call(htmlTags, prop);

  const materializeTag = (tag: string) => {
    const specialized = renderForTag(tag);
    (target as any)[tag] = specialized;
    touchedTags.add(tag);
    return specialized;
  };

  const resolvePlugin = (propName: string) => {
    let pluginCategory = category;
    if (!PluginManager.has(pluginCategory, propName)) {
      pluginCategory = "base";
      if (!PluginManager.has(pluginCategory, propName)) {
        return undefined;
      }
    }

    const component = PluginManager.get(pluginCategory, propName);
    const specialized = renderForTag(component);
    (target as any)[propName] = specialized;
    return specialized;
  };

  return new Proxy(target, {
    get(currentTarget, prop) {
      if (isHtmlTag(prop)) {
        // Tags shadow same-named base properties, matching the previous
        // eager assignment where tag entries overwrote colliding keys.
        if (!touchedTags.has(prop)) {
          return materializeTag(prop);
        }
        if (Object.prototype.hasOwnProperty.call(currentTarget, prop)) {
          return currentTarget[prop];
        }
      } else if (prop in currentTarget) {
        return (currentTarget as any)[prop];
      }

      return resolvePlugin(String(prop));
    },

    has(currentTarget, prop) {
      if (isHtmlTag(prop) && !touchedTags.has(prop)) {
        return true;
      }
      return Reflect.has(currentTarget, prop);
    },

    ownKeys(currentTarget) {
      const targetKeys = Reflect.ownKeys(currentTarget);
      const targetKeySet = new Set(targetKeys);
      const liveTags = tagNames.filter(
        (tag) => !touchedTags.has(tag) || targetKeySet.has(tag),
      );
      const baseOwn = targetKeys.filter(
        (key) => isBaseKey.has(key) && !isHtmlTag(key),
      );
      const addedOwn = targetKeys.filter(
        (key) => !isBaseKey.has(key) && !isHtmlTag(key),
      );
      return [...baseOwn, ...liveTags, ...addedOwn];
    },

    getOwnPropertyDescriptor(currentTarget, prop) {
      if (isHtmlTag(prop) && !touchedTags.has(prop)) {
        materializeTag(prop);
      }
      return Reflect.getOwnPropertyDescriptor(currentTarget, prop);
    },

    set(currentTarget, prop, value, receiver) {
      if (isHtmlTag(prop)) {
        touchedTags.add(prop);
      }
      return Reflect.set(currentTarget, prop, value, receiver);
    },

    deleteProperty(currentTarget, prop) {
      if (isHtmlTag(prop)) {
        touchedTags.add(prop);
      }
      return Reflect.deleteProperty(currentTarget, prop);
    },

    defineProperty(currentTarget, prop, descriptor) {
      if (isHtmlTag(prop)) {
        touchedTags.add(prop);
      }
      return Reflect.defineProperty(currentTarget, prop, descriptor);
    },

    preventExtensions(currentTarget) {
      // Freezing or sealing the proxy must produce the same own properties
      // as before, so materialize every still-virtual tag slot first.
      for (const tag of tagNames) {
        if (!touchedTags.has(tag)) {
          materializeTag(tag);
        }
      }
      return Reflect.preventExtensions(currentTarget);
    },
  }) as TProxy;
}
