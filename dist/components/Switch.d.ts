/// <reference types="react" />
import { MatchProps, SwitchProps } from "./types";
export declare const Match: ({ children }: MatchProps) => import("react").ReactNode;
export declare function Switch({ children, when, fallback }: SwitchProps): string | number | boolean | import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null;
