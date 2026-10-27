import type { ComponentRef, ReactNode, RefObject } from "react";
import { DelayedFallback } from "../../../src";
import { usePendingDelay, type UsePendingDelayOptions } from "../../../src/hooks";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Accepts<From, To> = [From] extends [To] ? true : false;
type BaseProps = Parameters<typeof DelayedFallback>[0];
type ButtonProps = Parameters<typeof DelayedFallback.button>[0];

export type PendingDelayContract =
  | Assert<Equal<ReturnType<typeof usePendingDelay>, boolean>>
  | Assert<Equal<Parameters<typeof usePendingDelay>, [boolean, UsePendingDelayOptions?]>>
  | Assert<Accepts<{ pending: boolean; children: ReactNode; fallback: ReactNode }, BaseProps>>
  | Assert<Equal<Accepts<{ pending: string }, BaseProps>, false>>
  | Assert<Equal<Accepts<{ pending: boolean; delay: string }, BaseProps>, false>>
  | Assert<Equal<Accepts<{ pending: boolean; minDuration: string }, BaseProps>, false>>
  | Assert<Equal<Accepts<{}, BaseProps>, false>>
  | Assert<Accepts<{ pending: boolean; type: "submit"; ref: RefObject<HTMLButtonElement> }, ButtonProps>>
  | Assert<Equal<Accepts<{ pending: boolean; ref: RefObject<HTMLAnchorElement> }, ButtonProps>, false>>
  | Assert<Equal<ComponentRef<typeof DelayedFallback.button>, HTMLButtonElement>>
  | Assert<Equal<ComponentRef<typeof DelayedFallback.div>, HTMLDivElement>>;

<DelayedFallback pending delay={100} minDuration={200} fallback="Loading">Ready</DelayedFallback>;
<DelayedFallback.button pending={false} type="button" onClick={(event) => event.currentTarget.focus()} />;
