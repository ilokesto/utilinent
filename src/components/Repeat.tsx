import { ComponentPropsWithRef, createElement } from "react";
import { htmlTags } from "../constants/htmlTags";
import { RepeatProps } from "../types";

type RepeatType = {
  (props: RepeatProps): React.ReactNode;
} & {
  [K in keyof JSX.IntrinsicElements]: (
    props: RepeatProps & ComponentPropsWithRef<K>
  ) => React.ReactNode;
};

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

export const Repeat = Object.assign(
  BaseRepeat,
  Object.fromEntries(htmlTags.map(tag => [tag, renderForTag(tag)]))
) as unknown as RepeatType;