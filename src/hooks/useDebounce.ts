import { useEffect, useState } from "react";

/**
 * @description Returns a debounced value after the delay elapses without changes.
 * Starts with the supplied value; changes and unmount cancel the pending timer.
 *
 * @param {T} value - Latest value to debounce.
 * @param {number} delay - Quiet period in milliseconds.
 * @returns {T} Initial value or the most recently settled value.
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState('');
 * const debounced = useDebounce(query, 300);
 * useEffect(() => search(debounced), [debounced]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
}
