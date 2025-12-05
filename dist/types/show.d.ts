import { ComponentPropsWithRef } from "react";
import { HtmlTag } from "../constants/htmlTags";
import { Fallback, NonNullableElements } from "./";
export interface ShowPropsArray<T extends unknown[]> extends Fallback {
    when: T;
    children: React.ReactNode | ((item: NonNullableElements<T>) => React.ReactNode);
}
export interface ShowProps<T = unknown> extends Fallback {
    when: T;
    children: React.ReactNode | ((item: NonNullable<T>) => React.ReactNode);
}
type ShowTagHelper<K extends HtmlTag> = {
    <const T extends unknown[]>(props: Omit<ComponentPropsWithRef<K>, "children"> & ShowPropsArray<T>): React.ReactNode;
    <const T extends unknown>(props: Omit<ComponentPropsWithRef<K>, "children"> & ShowProps<T>): React.ReactNode;
};
export type ShowType = {
    <const T extends unknown[]>(props: ShowPropsArray<T>): React.ReactNode;
    <const T extends unknown>(props: ShowProps<T>): React.ReactNode;
} & {
    [K in HtmlTag]: ShowTagHelper<K>;
};
export {};
