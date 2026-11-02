import { useEffect } from "react";
import type { ScrollLockProps } from "./types";

export type { ScrollLockProps } from "./types";

const ownedProperties = [
  "position",
  "top",
  "left",
  "width",
  "overflow-x",
  "overflow-y",
] as const;

interface DocumentLock {
  owners: number;
  restore: () => void;
}

const documentLocks = new WeakMap<Document, DocumentLock>();

function acquireLock(ownerDocument: Document): (() => void) | undefined {
  let lock = documentLocks.get(ownerDocument);
  if (!lock) {
    const body = ownerDocument.body;
    if (!body) {
      return;
    }
    const view = ownerDocument.defaultView;
    const scrollX = view?.scrollX ?? 0;
    const scrollY = view?.scrollY ?? 0;
    const originalStyles = ownedProperties.map((property) => ({
      property,
      value: body.style.getPropertyValue(property),
      priority: body.style.getPropertyPriority(property),
    }));

    // Fixing the body also prevents touch scrolling without document listeners.
    const lockedStyles = ["fixed", `${-scrollY}px`, `${-scrollX}px`, "100%", "hidden", "hidden"];
    ownedProperties.forEach((property, index) => {
      body.style.setProperty(property, lockedStyles[index], "important");
    });

    lock = {
      owners: 0,
      restore() {
        for (const { property, value, priority } of originalStyles) {
          if (value) {
            body.style.setProperty(property, value, priority);
          } else {
            body.style.removeProperty(property);
          }
        }
        // An author-level smooth scroll must not animate restoration.
        view?.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
      },
    };
    documentLocks.set(ownerDocument, lock);
  }
  lock.owners += 1;
  const ownedLock = lock;

  return () => {
    ownedLock.owners -= 1;
    if (ownedLock.owners === 0) {
      documentLocks.delete(ownerDocument);
      ownedLock.restore();
    }
  };
}

/**
 * @description Locks body scrolling without rendering DOM. Locks share ownership
 * per document; the last release restores the original owned inline style values,
 * their priorities, and the scroll position. Unrelated inline styles are preserved.
 * The default document is resolved only after mounting, so server rendering is inert.
 * @example
 * ```tsx
 * <ScrollLock when={isDialogOpen} />
 * <ScrollLock ownerDocument={previewDocument} />
 * ```
 * @param {ScrollLockProps} props - Scroll lock configuration.
 * @param {boolean} [props.when=true] - Whether to acquire a lock for this component.
 * @param {Document} [props.ownerDocument] - Target document; defaults to the global document after mounting.
 * @returns {null} No rendered DOM.
 */
export function ScrollLock({ when = true, ownerDocument }: ScrollLockProps): null {
  useEffect(() => {
    if (!when) {
      return;
    }
    const target = ownerDocument ?? (typeof document !== "undefined" ? document : undefined);
    if (target) {
      return acquireLock(target);
    }
  }, [when, ownerDocument]);

  return null;
}
