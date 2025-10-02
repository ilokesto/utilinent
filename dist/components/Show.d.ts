import { ComponentPropsWithRef } from "react";
import { ShowProps, ShowPropsArray } from "../types";
type ShowTagHelper<K extends keyof JSX.IntrinsicElements> = {
    <T extends unknown>(props: ShowProps<T> & ComponentPropsWithRef<K>): React.ReactNode;
    <T extends unknown[]>(props: ShowPropsArray<T> & ComponentPropsWithRef<K>): React.ReactNode;
};
type ShowTagHelpers = {
    [K in keyof JSX.IntrinsicElements]: ShowTagHelper<K>;
};
type ShowType = {
    <T extends unknown>(props: ShowProps<T>): React.ReactNode;
    <T extends unknown[]>(props: ShowPropsArray<T>): React.ReactNode;
} & ShowTagHelpers;
export declare const Show: ShowType;
export {};
