import { ComponentPropsWithRef, createElement, forwardRef } from "react";
import { htmlTags } from "../constants/htmlTags";
import type { RepeatProps, RepeatType } from "../types/repeat";
import { For } from "./For";

function BaseRepeat({ times, children, fallback = null }: RepeatProps) {
  if (!times || times <= 0 || !Number.isInteger(times)) {
    return fallback ?? null;
  }

  return <For each={Array.from({ length: times }, (_, i) => i)}>{children}</For>;
}

const renderForTag =
  (tag: any) =>
  // forward ref so consumers can attach a ref to the underlying DOM element
  forwardRef(
    ({ times, children, fallback = null, ...props }: RepeatProps & ComponentPropsWithRef<any>, ref: any) => {
      const content =
        times && times > 0 && Number.isInteger(times)
          ? Array.from({ length: times }, (_, i) => children(i))
          : fallback ?? null;
      return createElement(tag, { ...props, ref }, content);
    }
  );

const tagEntries = htmlTags.reduce((acc, tag) => {
  (acc as any)[tag] = renderForTag(tag);
  return acc;
}, {} as any);

export const Repeat = Object.assign(BaseRepeat, tagEntries) as unknown as RepeatType;