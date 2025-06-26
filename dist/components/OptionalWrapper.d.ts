/// <reference types="react" />
import { ReactNode } from "./types";
export declare function OptionalWrapper({ when, children, wrapper, }: {
    when: boolean;
    children: ReactNode;
    wrapper: (children: ReactNode) => ReactNode;
}): ReactNode;
