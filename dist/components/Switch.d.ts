/// <reference types="react" />
import type { ExtractByKeyValue, ExtractValues, LiteralKeys, SwitchProps } from "./types";
export declare function createSwitcher<T, K extends LiteralKeys<T>>(data: T): {
    Switch: ({ children, when, fallback }: SwitchProps<T, K>) => string | number | boolean | import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null;
    Match: <V extends ExtractValues<T, K>>({ children }: {
        case: V;
        children: (props: ExtractByKeyValue<T, K, V>) => React.ReactNode;
    }) => import("react").ReactNode;
};
