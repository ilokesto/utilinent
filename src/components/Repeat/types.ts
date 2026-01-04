import type { Fallback, TagHelperFn, TagProxyType } from "../../types";

export interface RepeatProps extends Fallback {
  times: number; 
  children: (index: number) => React.ReactNode; 
}

type BaseRepeatType<X = object> = {
  (props: X & RepeatProps): React.ReactNode;
}

interface BaseRepeatTypeFn extends TagHelperFn {
  type: BaseRepeatType<this["props"]>;
}

export type RepeatType =  TagProxyType<BaseRepeatTypeFn, "repeat">;