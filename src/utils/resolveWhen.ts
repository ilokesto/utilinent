import type { NonNullableElements } from "../types";

/**
 * @description Resolves a condition value for conditional rendering.
 *
 * Arrays are truthy when non-empty and every element is truthy;
 * all other values use standard truthiness.
 *
 * @param {unknown} value - A scalar condition or an array whose members must all be truthy.
 * @returns {boolean} Whether the condition passes, narrowing scalar values or array members to nonnull types.
 * @example
 * ```ts
 * resolveWhen([true, "ready"]); // true
 * resolveWhen([]); // false
 * resolveWhen(0); // false
 * ```
 */
export function resolveWhen<T extends readonly unknown[]>(value: T): value is NonNullableElements<T>;
export function resolveWhen<T>(value: T): value is NonNullable<T>;
export function resolveWhen(value: unknown) {
  return Array.isArray(value) ? value.length > 0 && value.every(Boolean) : !!value;
}
