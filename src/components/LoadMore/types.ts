import type { ComponentPropsWithRef, ReactNode } from "react";
import type { UseInfiniteSentinelOptions, UseInfiniteSentinelResult } from "../../hooks/useInfiniteSentinel";
import type { BaseTypeHelperFn, ProxyType } from "../../types";

export type LoadMoreState = Omit<UseInfiniteSentinelResult, "ref">;

export interface LoadMoreProps extends UseInfiniteSentinelOptions {
  children?: ReactNode | ((state: LoadMoreState) => ReactNode);
}

interface LoadMoreTypeHelper extends BaseTypeHelperFn {
  type: (props: LoadMoreProps & Omit<this["props"], keyof LoadMoreProps>) => ReactNode;
}

export type LoadMoreType =
  ProxyType<LoadMoreTypeHelper, "loadMore"> &
  ((props: LoadMoreProps & Omit<ComponentPropsWithRef<"div">, keyof LoadMoreProps>) => ReactNode);
