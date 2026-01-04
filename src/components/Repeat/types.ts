import type { BaseTypeHelperFn, Fallback, TagProxyType } from "../../types";

export interface RepeatProps extends Fallback {
  times: number; 
  children: (index: number) => React.ReactNode; 
}

type BaseRepeatType<X = object> = {
  (props: X & RepeatProps): React.ReactNode;
}

interface BaseRepeatTypeFn extends BaseTypeHelperFn {
  type: BaseRepeatType<this["props"]>;
}

export type RepeatType =  TagProxyType<BaseRepeatTypeFn, "repeat">;