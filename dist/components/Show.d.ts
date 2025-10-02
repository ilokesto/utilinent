import { ComponentPropsWithRef } from "react";
import { ShowProps, ShowPropsArray } from "../types";
type ShowType = {
    <T extends unknown[]>(props: ShowPropsArray<T>): React.ReactNode;
    <T extends unknown>(props: ShowProps<T>): React.ReactNode;
} & {
    [K in keyof JSX.IntrinsicElements]: {
        <T extends unknown[]>(props: ShowPropsArray<T> & ComponentPropsWithRef<K>): React.ReactNode;
        <T extends unknown>(props: ShowProps<T> & ComponentPropsWithRef<K>): React.ReactNode;
    };
};
export declare const Show: ShowType;
export {};
