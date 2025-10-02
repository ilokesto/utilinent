import { ComponentPropsWithRef, createElement } from "react";
import { htmlTags } from "../constants/htmlTags";
import type { RepeatProps, RepeatType } from "../types/repeat";

function BaseRepeat({ times, children, fallback = null }: RepeatProps) {
  if (!times || times <= 0 || !Number.isInteger(times)) {
    return fallback ?? null;
  }

  return <>{Array.from({ length: times }, (_, i) => children(i))}</>;
}

const renderForTag =
  (tag: any) =>
  ({ times, children, fallback = null, ...props }: RepeatProps & ComponentPropsWithRef<any>) => {
    if (!times || times <= 0 || !Number.isInteger(times)) {
      return fallback ?? null;
    }
    const content = Array.from({ length: times }, (_, i) => children(i));
    return createElement(tag, props, content);
  };

const tagEntries = htmlTags.reduce((acc, tag) => {
  (acc as any)[tag] = renderForTag(tag);
  return acc;
}, {} as any);

export const Repeat = Object.assign(BaseRepeat, tagEntries) as unknown as RepeatType;