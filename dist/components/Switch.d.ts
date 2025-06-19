/// <reference types="react" />
import type { ExtractKeyValues, LiteralKeys, MatchProps, SwitchProps } from "./types";
export declare function createSwitchMatch<T, K extends LiteralKeys<T>>(data: T): {
    Switch: ({ children, when, fallback }: SwitchProps<T, K>) => string | number | boolean | import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null;
    Match: <C extends ExtractKeyValues<T, K>>({ children }: MatchProps<T, K, C>) => import("react").ReactNode;
};
