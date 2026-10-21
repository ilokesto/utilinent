import { useMemo } from "react";
import type { Ref } from "react";
import { composeRefs } from "../../utils/composeRefs";

/** Ref accepted for the Slot host element and its child element. */
type SlotRef = Ref<HTMLElement> | undefined;

/**
 * Composes the forwarded Slot ref with the child element's ref while keeping
 * the composed callback referentially stable: identical inputs reuse the
 * previous callback so React does not detach and re-attach refs on rerenders.
 *
 * When either input changes, a new composed callback is produced so React
 * detaches the previous ref and attaches the new one exactly once. Without a
 * forwarded ref the child ref passes through unchanged.
 */
export function useComposedRef(forwardedRef: SlotRef, childRef: SlotRef) {
  return useMemo(
    () => forwardedRef ? composeRefs(forwardedRef, childRef) : childRef,
    [forwardedRef, childRef],
  );
}
