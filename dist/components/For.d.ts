import { ComponentPropsWithRef } from "react";
import type { ForProps } from "../types";
type ForType = {
    <T extends Array<unknown>>(props: ForProps<T>): React.ReactNode;
} & {
    [K in keyof JSX.IntrinsicElements]: <T extends Array<unknown>>(props: ForProps<T> & ComponentPropsWithRef<K>) => React.ReactNode;
};
export declare const For: ForType;
export {};
