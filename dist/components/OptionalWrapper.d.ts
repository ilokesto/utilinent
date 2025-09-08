/// <reference types="react" />
import { React.ReactNode } from "./types";
export declare function OptionalWrapper({ when, children, wrapper, }: {
    when: boolean;
    children: React.ReactNode;
    wrapper: (children: React.ReactNode) => React.ReactNode;
}): React.ReactNode;
