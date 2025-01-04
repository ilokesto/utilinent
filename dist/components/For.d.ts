/// <reference types="react" />
import type { ForProps } from "./types";
export declare function For<T extends Array<unknown>>({ each, children, fallback, }: ForProps<T>): string | number | boolean | import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null;
