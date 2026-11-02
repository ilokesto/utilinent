import { REGISTRY_CATEGORIES, type RegistryCategory } from "../types";

type PluginRegistration = Partial<
  Record<RegistryCategory, Record<string, any>>
>;

/**
 * @description Registers custom component variants shared by polymorphic utility components.
 *
 * Component-specific categories take precedence over the shared base category.
 * Already resolved proxy variants remain cached even if a registration changes.
 *
 * @example
 * ```tsx
 * import { PluginManager } from '@ilokesto/utilinent';
 *
 * PluginManager.register({
 *   base: { Panel: 'section' },
 * });
 *
 * declare module '@ilokesto/utilinent' {
 *   interface UtilinentRegister {
 *     base: {
 *       Panel: React.ComponentType<React.ComponentPropsWithRef<'section'>>;
 *     };
 *   }
 * }
 * ```
 */
export class PluginManager {
  private static instance: PluginManager;

  private plugins = new Map<string, Map<string, any>>();

  private constructor() {
    for (const category of REGISTRY_CATEGORIES) {
      this.plugins.set(category, new Map());
    }
  }

  private getCategory(category: string): Map<string, any> {
    const existing = this.plugins.get(category);
    if (existing) {
      return existing;
    }
    const created = new Map<string, any>();
    this.plugins.set(category, created);
    return created;
  }

  private static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * @description Registers named component variants in component-specific or shared categories.
   * @param {PluginRegistration} plugins - Categories containing variant-name-to-component mappings.
   * @param {Record<string, any>} [plugins.show] - Variants specific to Show.
   * @param {Record<string, any>} [plugins.for] - Variants specific to For.
   * @param {Record<string, any>} [plugins.repeat] - Variants specific to Repeat.
   * @param {Record<string, any>} [plugins.separated] - Variants specific to Separated.
   * @param {Record<string, any>} [plugins.mount] - Variants specific to Mount.
   * @param {Record<string, any>} [plugins.switch] - Variants specific to Switch.
   * @param {Record<string, any>} [plugins.base] - Shared variants used when a component-specific variant is absent.
   * @example
   * ```ts
   * PluginManager.register({ base: { Panel: "section" } });
   * ```
   */
  static register(plugins: PluginRegistration): void {
    const instance = PluginManager.getInstance();

    for (const [category, components] of Object.entries(plugins)) {
      if (components) {
        for (const [name, component] of Object.entries(components)) {
          instance.getCategory(category).set(name, component);
        }
      }
    }
  }

  /**
   * @description Looks up the current registration without materializing a proxy variant.
   * @param {K} category - The category to inspect.
   * @param {string} name - The registered variant name.
   * @returns {any} The registered component value, or undefined when the name is absent.
   * @example
   * ```ts
   * const Panel = PluginManager.get("base", "Panel");
   * ```
   */
  static get<K extends RegistryCategory>(category: K, name: string): any {
    return PluginManager.getInstance().plugins.get(category)?.get(name);
  }

  /**
   * @description Reports whether a category currently contains a named registration.
   * @param {K} category - The category to inspect.
   * @param {string} name - The registered variant name.
   * @returns {boolean} Whether the name is registered in the requested category.
   * @example
   * ```ts
   * const isRegistered = PluginManager.has("base", "Panel");
   * ```
   */
  static has<K extends RegistryCategory>(category: K, name: string): boolean {
    return PluginManager.getInstance().plugins.get(category)?.has(name) ?? false;
  }

  /**
   * @description Returns the live registration map, creating an empty category when needed.
   * @param {K} category - The category whose registrations should be returned.
   * @returns {Map<string, any>} The category's mutable map of variant names to component values.
   * @example
   * ```ts
   * const variants = PluginManager.getAll("base");
   * const names = [...variants.keys()];
   * ```
   */
  static getAll<K extends RegistryCategory>(
    category: K,
): Map<string, any> {
    return PluginManager.getInstance().getCategory(category);
  }

  /**
   * @description Removes a registration without invalidating already cached proxy variants.
   * @param {K} category - The category containing the registration.
   * @param {string} name - The registered variant name to remove.
   * @returns {boolean} Whether an existing registration was removed.
   * @example
   * ```ts
   * PluginManager.unregister("base", "Panel");
   * ```
   */
  static unregister<K extends RegistryCategory>(
    category: K,
    name: string,
  ): boolean {
    return PluginManager.getInstance().plugins.get(category)?.delete(name) ?? false;
  }
}
