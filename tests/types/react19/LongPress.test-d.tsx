import { createRef, type ComponentRef, type RefObject } from "react";
import { LongPress, type LongPressProps } from "@ilokesto/utilinent";

type Equal<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type Assert<T extends true> = T;
type Assignable<A, B> = [A] extends [B] ? true : false;
type DefaultRef = Assert<Equal<ComponentRef<typeof LongPress>, HTMLButtonElement>>;
type AnchorRef = Assert<Equal<ComponentRef<typeof LongPress.a>, HTMLAnchorElement>>;
type WrongRef = Assert<Equal<Assignable<
  { ref: RefObject<HTMLAnchorElement | null> }, Parameters<typeof LongPress>[0]
>, false>>;
type WrongDuration = Assert<Equal<Assignable<{ duration: string }, LongPressProps>, false>>;
type LongEvent = Assert<Equal<Parameters<NonNullable<LongPressProps["onLongPress"]>>[0], PointerEvent>>;
type EndCallback = Assert<Equal<NonNullable<LongPressProps["onLongPressEnd"]>, () => void>>;

const button = <LongPress type="button" ref={createRef<HTMLButtonElement>()} duration={600}
  movementThreshold={8} onLongPress={(event) => event.pointerType}
  onClick={(event) => event.currentTarget.disabled} />;
const anchor = <LongPress.a href="/item" ref={(node) => { node?.focus(); return () => {}; }}
  onClick={(event) => event.currentTarget.href} />;
const div = <LongPress.div disabled onPointerDown={(event) => event.currentTarget.align} />;

export type LongPressReact19Contract = DefaultRef | AnchorRef | WrongRef | WrongDuration | LongEvent | EndCallback;
export { button, anchor, div };
