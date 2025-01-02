import { Key, ReactElement, ReactNode } from "react";
export { Key };
export type ShowProps = {
    when: boolean;
    children: ReactNode;
    fallback?: ReactNode;
};
export type MapProps<T> = {
    each: T[];
    fallback?: ReactNode;
    children: (item: T, index: number) => ReactNode;
};
export type SwitchProps = {
    children: Array<ReactElement>;
    when: Key;
    fallback?: ReactNode;
};
export type MatchProps = {
    children: ReactNode;
};
