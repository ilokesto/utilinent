import { ComponentPropsWithRef } from "react";
import { RepeatProps } from "../types";
type RepeatType = {
    (props: RepeatProps): React.ReactNode;
} & {
    [K in keyof JSX.IntrinsicElements]: (props: RepeatProps & ComponentPropsWithRef<K>) => React.ReactNode;
};
export declare const Repeat: RepeatType;
export {};
