import type { MutableRefObject, Ref } from "react";

type RefCleanup = () => void;
type ComposableRef<T> =
  | Ref<T>
  | ((node: T | null) => RefCleanup | undefined)
  | undefined;

function setRef<T>(ref: ComposableRef<T>, node: T | null): RefCleanup | void {
  if (typeof ref === "function") {
    return ref(node);
  }

  if (ref != null) {
    const mutableRef: MutableRefObject<T | null> = ref;
    mutableRef.current = node;
  }
}

/**
 * @description Composes callback and object refs into a single callback ref.
 *
 * Supports React 19 ref cleanup: if any ref returns a cleanup function,
 * a composite cleanup is returned that resets all refs on unmount.
 *
 * @param {ComposableRef<T>[]} refs - Callback or object refs to attach to the same target.
 * @returns {(node: T | null) => RefCleanup | void} A callback that attaches every ref and returns combined cleanup when any callback supplies one.
 * @example
 * ```tsx
 * const mergedRef = React.useMemo(
 *   () => composeRefs(localRef, forwardedRef),
 *   [localRef, forwardedRef],
 * );
 * return <div ref={mergedRef} />;
 * ```
 */
export function composeRefs<T>(...refs: ComposableRef<T>[]) {
  return (node: T | null) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (typeof cleanup === "function") {
        hasCleanup = true;
      }
      return cleanup;
    });

    if (hasCleanup) {
      return () => {
        cleanups.forEach((cleanup, index) => {
          if (typeof cleanup === "function") {
            cleanup();
          } else {
            setRef(refs[index], null);
          }
        });
      };
    }
  };
}
