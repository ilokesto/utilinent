import type { ComponentProps } from "react";
import { ScrollLock, type ScrollLockProps } from "@ilokesto/utilinent";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Assert<Condition extends true> = Condition;

type Props = ComponentProps<typeof ScrollLock>;
type ExactProps = Assert<Equal<Props, ScrollLockProps>>;
type ExactWhen = Assert<Equal<Props["when"], boolean | undefined>>;
type ExactDocument = Assert<Equal<Props["ownerDocument"], Document | undefined>>;
type ReturnsNull = Assert<Equal<ReturnType<typeof ScrollLock>, null>>;
type NoChildren = Assert<Equal<"children" extends keyof Props ? true : false, false>>;

const defaults = <ScrollLock />;
const controlled = <ScrollLock when={false} ownerDocument={document} />;

export type ScrollLockReact19TypeContract =
  | ExactProps | ExactWhen | ExactDocument | ReturnsNull | NoChildren;
export { defaults, controlled };
