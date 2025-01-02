import { useEffect, useState } from "react";
import { Show } from "./Show";
import { MountProps } from "./types";

export function Mount({ children, fallback = null }: MountProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false);
    };
  }, []);

  return <Show when={isMounted} fallback={fallback}>{children}</Show>;
}