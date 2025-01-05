import { useEffect, useState } from "react";
import type { MountProps, ReactNode } from "./types";

export function Mount({ children, fallback = null }: MountProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [resolvedChildren, setResolvedChildren] = useState<ReactNode | null>(null);

  useEffect(() => {
    setIsMounted(true);

    // 비동기 처리를 위해 async 함수로 감싸고, children이 함수인지 아닌지에 따라 다르게 처리
    (async () => {
      if (typeof children === "function") {
        const result = await children();
        setResolvedChildren(result);
      } else {
        setResolvedChildren(children);
      }
    })();

    return () => {
      setIsMounted(false);
    };
  }, [children]);

  return isMounted ? resolvedChildren : fallback;
}
