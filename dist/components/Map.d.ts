/// <reference types="react" />
import type { MapProps } from "./types";
export declare function Map<T>({ each, children, fallback, }: MapProps<T>): string | number | boolean | import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null;
