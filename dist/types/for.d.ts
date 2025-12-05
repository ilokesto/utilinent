import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";
import { UtilinentRegisterBase, UtilinentRegisterFor } from "./register";
export interface ForProps<T extends Array<unknown>> extends Fallback {
    each: T | null | undefined;
    children: (item: T[number], index: number) => React.ReactNode;
    before?: React.ReactNode;
    after?: React.ReactNode;
}
type ForTagHelper<K extends HtmlTag> = {
    <const T extends Array<unknown>>(props: ForProps<T> & Omit<React.ComponentPropsWithRef<K>, 'children'>): React.ReactNode;
};
type ForRegisterHelper<C> = C extends React.ComponentType<infer P> ? {
    <const T extends Array<unknown>>(props: Omit<P, "children"> & ForProps<T>): React.ReactNode;
} : C;
export type ForType = {
    <const T extends Array<unknown>>(props: ForProps<T>): React.ReactNode;
} & {
    [K in HtmlTag]: ForTagHelper<K>;
} & {
    [K in keyof UtilinentRegisterFor]: ForRegisterHelper<UtilinentRegisterFor[K]>;
} & {
    [K in keyof UtilinentRegisterBase]: ForRegisterHelper<UtilinentRegisterBase[K]>;
};
export {};
