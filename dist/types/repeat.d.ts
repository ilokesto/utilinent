import { ComponentPropsWithRef } from "react";
import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";
export interface RepeatProps extends Fallback {
    times: number;
    children: (index: number) => React.ReactNode;
}
type RepeatTagHelper<K extends HtmlTag> = {
    (props: RepeatProps & Omit<ComponentPropsWithRef<K>, "children">): React.ReactNode;
};
export type RepeatType = {
    (props: RepeatProps): React.ReactNode;
} & {
    [K in HtmlTag]: RepeatTagHelper<K>;
};
export {};
