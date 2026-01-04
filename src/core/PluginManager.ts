import type { RegistryCategory } from "../types";

/**
 * 플러그인 등록을 위한 타입
 * Register 인터페이스의 각 카테고리에 대해 부분적으로 등록 가능
 */
type PluginRegistration = {
  [K in RegistryCategory]?: Record<string, any>;
};

/**
 * 플러그인 컴포넌트를 등록하고 관리하는 싱글턴 클래스
 * 
 * @example
 * ```typescript
 * import { UtilinentPluginManager } from '@ilokesto/utilinent';
 * import Link from 'next/link';
 * import { motion } from 'framer-motion';
 * 
 * // 컴포넌트 등록
 * UtilinentPluginManager.register({
 *   show: {
 *     Link: Link,
 *   },
 *   base: {
 *     motionButton: motion.button,
 *   }
 * });
 * 
 * // 타입 등록 (별도 파일에서)
 * declare module '@ilokesto/utilinent' {
 *   interface Register {
 *     show: {
 *       Link: typeof Link;
 *     };
 *     base: {
 *       motionButton: typeof motion.button;
 *     };
 *   }
 * }
 * ```
 */
export class PluginManager {
  private static instance: PluginManager;
  
  private plugins: {
    [key in RegistryCategory]: Map<string, any>;
  } = {
    show: new Map(),
    for: new Map(),
    repeat: new Map(),
    mount: new Map(),
    switch: new Map(),
    base: new Map(),
  };

  private constructor() {
    // 싱글턴 패턴: private constructor
  }

  /**
   * PluginManager 인스턴스를 가져옵니다
   */
  private static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * 플러그인 컴포넌트들을 객체 형태로 등록합니다
   * 
   * @param plugins - 카테고리별 컴포넌트 객체
   * 
   * @example
   * ```typescript
   * UtilinentPluginManager.register({
   *   show: {
   *     Link: Link,
   *     Button: CustomButton,
   *   },
   *   base: {
   *     motionDiv: motion.div,
   *   }
   * });
   * ```
   */
  static register(plugins: PluginRegistration): void {
    const instance = PluginManager.getInstance();
    
    (Object.keys(plugins) as Array<RegistryCategory>).forEach((category) => {
      const components = plugins[category];
      if (components) {
        Object.entries(components).forEach(([name, component]) => {
          instance.registerOne(category, name, component);
        });
      }
    });
  }

  /**
   * 단일 플러그인 컴포넌트를 등록합니다 (내부용)
   */
  private registerOne<K extends RegistryCategory>(
    category: K,
    name: string,
    component: any
  ): void {
    this.plugins[category].set(name, component);
  }

  /**
   * 등록된 플러그인 컴포넌트를 가져옵니다 (내부용)
   */
  static get<K extends RegistryCategory>(category: K, name: string): any {
    const instance = PluginManager.getInstance();
    return instance.plugins[category].get(name);
  }

  /**
   * 특정 카테고리의 모든 플러그인을 가져옵니다 (내부용)
   */
  static getAll<K extends RegistryCategory>(category: K): Map<string, any> {
    const instance = PluginManager.getInstance();
    return instance.plugins[category];
  }

  /**
   * 플러그인이 등록되어 있는지 확인합니다
   */
  static has<K extends RegistryCategory>(category: K, name: string): boolean {
    const instance = PluginManager.getInstance();
    return instance.plugins[category].has(name);
  }

  /**
   * 플러그인을 제거합니다
   */
  static unregister<K extends RegistryCategory>(category: K, name: string): boolean {
    const instance = PluginManager.getInstance();
    return instance.plugins[category].delete(name);
  }
}
