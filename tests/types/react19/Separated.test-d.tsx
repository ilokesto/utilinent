import type { RefObject } from "react";
import { Separated, type SeparatedProps } from "@ilokesto/utilinent";

type Equal<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type Assert<T extends true> = T;
type Assignable<A, B> = [A] extends [B] ? true : false;

const items = [{ id: "hello", count: 1 }, { id: "world", count: 2 }] as const;
const readonlyItems = (
  <Separated each={items} by={<hr />}>
    {(item, index) => {
      const inferred: Assert<Equal<typeof item, typeof items[number]>> = true;
      const indexed: Assert<Equal<typeof index, number>> = true;
      return <span key={item.id}>{item.count}:{String(inferred && indexed)}</span>;
    }}
  </Separated>
);
const tagged = (
  <Separated.button each={[1, 2]} by="|" type="button"
    ref={(node) => { node?.focus(); return () => {}; }}>
    {(item) => {
      const inferred: Assert<Equal<typeof item, 1 | 2>> = true;
      return `${item}:${inferred}`;
    }}
  </Separated.button>
);

type RequiredArray = Assert<Equal<Assignable<
  { by: string; children: (item: string) => string },
  SeparatedProps<string[]>
>, false>>;
type RequiredSeparator = Assert<Equal<Assignable<
  { each: string[]; children: (item: string) => string },
  SeparatedProps<string[]>
>, false>>;
type WrongRenderer = Assert<Equal<Assignable<
  { each: string[]; by: string; children: (item: number) => string },
  SeparatedProps<string[]>
>, false>>;
type WrongRef = Assert<Equal<Assignable<
  { each: string[]; by: string; children: (item: unknown) => string; ref: RefObject<HTMLAnchorElement | null> },
  Parameters<typeof Separated.button>[0]
>, false>>;
type ValidRef = Assert<Equal<Assignable<
  { each: string[]; by: string; children: (item: unknown) => string; ref: RefObject<HTMLButtonElement | null> },
  Parameters<typeof Separated.button>[0]
>, true>>;

export type SeparatedReact19Contract = RequiredArray | RequiredSeparator | WrongRenderer | WrongRef | ValidRef;
export { readonlyItems, tagged };
