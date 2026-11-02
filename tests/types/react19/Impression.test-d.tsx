import { createRef, type ComponentRef, type RefObject } from "react";
import { Impression, type ImpressionProps } from "@ilokesto/utilinent";

type Equal<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type Assert<T extends true> = T;
type Assignable<A, B> = [A] extends [B] ? true : false;
type DivRef = Assert<Equal<ComponentRef<typeof Impression>, HTMLDivElement>>;
type ButtonRef = Assert<Equal<ComponentRef<typeof Impression.button>, HTMLButtonElement>>;
type WrongRef = Assert<Equal<Assignable<
  { ref: RefObject<HTMLAnchorElement | null> }, Parameters<typeof Impression.button>[0]
>, false>>;
type BadRatio = Assert<Equal<Assignable<{ ratio: string }, ImpressionProps>, false>>;
type BadCallback = Assert<Equal<Assignable<{ onEnd: string }, ImpressionProps>, false>>;
const div = <Impression ref={createRef<HTMLDivElement>()} onStart={() => {}} onEnd={() => {}}>Story</Impression>;
const button = <Impression.button type="button" ref={(node) => { node?.focus(); return () => {}; }}>
  {(active) => { const state: boolean = active; return String(state); }}
</Impression.button>;

export type ImpressionReact19Contract = DivRef | ButtonRef | WrongRef | BadRatio | BadCallback;
export { div, button };
