import { ComponentPropsWithRef } from "react";
import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";
import { UtilinentRegisterBase, UtilinentRegisterRepeat } from "./register";
export interface RepeatProps extends Fallback {
    times: number;
    children: (index: number) => React.ReactNode;
}
type RepeatTagHelper<K extends HtmlTag> = {
    (props: RepeatProps & Omit<ComponentPropsWithRef<K>, "children">): React.ReactNode;
};
type RepeatRegisterHelper<C> = C extends React.ComponentType<infer P> ? {
    (props: Omit<P, "children"> & RepeatProps): React.ReactNode;
} : C;
export type RepeatType = {
    (props: RepeatProps): React.ReactNode;
} & {
    [K in HtmlTag]: RepeatTagHelper<K>;
} & {
    [K in keyof UtilinentRegisterRepeat]: RepeatRegisterHelper<UtilinentRegisterRepeat[K]>;
} & {
    [K in keyof UtilinentRegisterBase]: RepeatRegisterHelper<UtilinentRegisterBase[K]>;
};
export {};
