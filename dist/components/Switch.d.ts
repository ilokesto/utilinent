/// <reference types="react" />
import type { MatchProps, SwitchProps } from "./types";
export declare function Match({ children, element }: MatchProps): import("react").ReactNode;
export declare function Switch({ children, when, fallback }: SwitchProps): string | number | boolean | import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null;
