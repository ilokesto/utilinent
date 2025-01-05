import { useEffect, useState } from "react";
import type { MountProps } from "./types";

export function Mount({ children, fallback = null }: MountProps) {
  const [resolvedChildren, setResolvedChildren] = useState<MountProps["fallback"]>(fallback);

  useEffect(() => {
    (async () => setResolvedChildren(typeof children === "function" ? await children() : children))();
  }, [children]);

  return resolvedChildren;
}
