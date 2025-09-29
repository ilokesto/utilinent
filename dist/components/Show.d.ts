import type { ShowProps, ShowPropsArray } from "../types";
export declare function Show<T extends unknown[]>({ when, children, fallback }: ShowPropsArray<T>): React.ReactNode;
export declare function Show<T extends unknown>({ when, children, fallback }: ShowProps<T>): React.ReactNode;
