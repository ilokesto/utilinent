import type { ComponentRef, ReactNode, RefObject } from "react";
import { DelayedFallback } from "@ilokesto/utilinent";
import { usePendingDelay, type UsePendingDelayOptions } from "../../dist/hooks";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Accepts<From, To> = [From] extends [To] ? true : false;
type BaseProps = Parameters<typeof DelayedFallback>[0];
type ButtonProps = Parameters<typeof DelayedFallback.button>[0];

export type PendingDelayReact19Contract =
  | Assert<Equal<ReturnType<typeof usePendingDelay>, boolean>>
  | Assert<Equal<Parameters<typeof usePendingDelay>, [boolean, UsePendingDelayOptions?]>>
  | Assert<Accepts<{ pending: boolean; children: ReactNode; fallback: ReactNode }, BaseProps>>
  | Assert<Equal<Accepts<{ pending: string }, BaseProps>, false>>
  | Assert<Equal<Accepts<{ pending: boolean; delay: string }, BaseProps>, false>>
  | Assert<Equal<Accepts<{ pending: boolean; minDuration: string }, BaseProps>, false>>
  | Assert<Equal<Accepts<{}, BaseProps>, false>>
  | Assert<Accepts<{ pending: boolean; type: "submit"; ref: RefObject<HTMLButtonElement | null> }, ButtonProps>>
  | Assert<Equal<Accepts<{ pending: boolean; ref: RefObject<HTMLAnchorElement | null> }, ButtonProps>, false>>
  | Assert<Equal<ComponentRef<typeof DelayedFallback.button>, HTMLButtonElement>>
  | Assert<Equal<ComponentRef<typeof DelayedFallback.div>, HTMLDivElement>>;
