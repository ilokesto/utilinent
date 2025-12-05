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
    static instance;
    plugins = {
        show: new Map(),
        for: new Map(),
        repeat: new Map(),
        base: new Map(),
    };
    constructor() {
        // 싱글턴 패턴: private constructor
    }
    /**
     * PluginManager 인스턴스를 가져옵니다
     */
    static getInstance() {
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
    static register(plugins) {
        const instance = PluginManager.getInstance();
        Object.keys(plugins).forEach((category) => {
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
    registerOne(category, name, component) {
        this.plugins[category].set(name, component);
    }
    /**
     * 등록된 플러그인 컴포넌트를 가져옵니다 (내부용)
     */
    static get(category, name) {
        const instance = PluginManager.getInstance();
        return instance.plugins[category].get(name);
    }
    /**
     * 특정 카테고리의 모든 플러그인을 가져옵니다 (내부용)
     */
    static getAll(category) {
        const instance = PluginManager.getInstance();
        return instance.plugins[category];
    }
    /**
     * 플러그인이 등록되어 있는지 확인합니다
     */
    static has(category, name) {
        const instance = PluginManager.getInstance();
        return instance.plugins[category].has(name);
    }
    /**
     * 플러그인을 제거합니다
     */
    static unregister(category, name) {
        const instance = PluginManager.getInstance();
        return instance.plugins[category].delete(name);
    }
}
