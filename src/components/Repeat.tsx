import { ComponentPropsWithRef, createElement, forwardRef } from "react";
import { createTagProxy } from "../core/createTagProxy";
import type { RepeatProps, RepeatType } from "../types/repeat";

function BaseRepeat({ times, children, fallback = null }: RepeatProps) {
  const content =
        times && times > 0 && Number.isInteger(times)
          ? Array.from({ length: times }, (_, i) => children(i))
          : fallback ?? null;

  return <>{content}</>;
}

const renderForTag =
  (tag: any) =>
  // forward ref so consumers can attach a ref to the underlying DOM element
  forwardRef(
    ({ times, children, fallback = null, ...props }: RepeatProps & ComponentPropsWithRef<any>, ref: any) => {
      const content =
        BaseRepeat({ times, children, fallback });
      return createElement(tag, { ...props, ref }, content);
    }
  );

export const Repeat = createTagProxy<RepeatType, typeof BaseRepeat>(BaseRepeat, renderForTag, "repeat");
