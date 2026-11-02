/**
 * @description Narrows a nonnull object or function with a callable then property to PromiseLike.
 * @param {unknown} value - The candidate value to inspect without invoking it.
 * @returns {boolean} Whether the value is a thenable; a true result narrows it to PromiseLike<T>.
 * @example
 * ```ts
 * if (isPromiseLike<string>(candidate)) {
 *   candidate.then((text) => text.toUpperCase());
 * }
 * ```
 */
export function isPromiseLike<T = unknown>(
  value: unknown,
): value is PromiseLike<T> {
  return (
    (typeof value === "object" || typeof value === "function") &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}
