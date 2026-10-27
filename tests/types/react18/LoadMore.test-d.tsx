import { createRef, type ComponentRef, type RefObject } from "react";
import { LoadMore, type LoadMoreState } from "../../../src";
import { useInfiniteSentinel, type UseInfiniteSentinelOptions } from "../../../src/hooks";

type Equal<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type Assert<T extends true> = T;
type Assignable<A, B> = [A] extends [B] ? true : false;
type DivRef = Assert<Equal<ComponentRef<typeof LoadMore>, HTMLDivElement>>;
type ButtonRef = Assert<Equal<ComponentRef<typeof LoadMore.button>, HTMLButtonElement>>;
type WrongRef = Assert<Equal<Assignable<
  { onLoadMore: () => void; hasMore: true; ref: RefObject<HTMLAnchorElement> },
  Parameters<typeof LoadMore.button>[0]
>, false>>;
type RequiredHasMore = Assert<Equal<Assignable<
  { onLoadMore: () => void }, UseInfiniteSentinelOptions
>, false>>;
type BadCallback = Assert<Equal<Assignable<
  { onLoadMore: string; hasMore: true }, UseInfiniteSentinelOptions
>, false>>;
type HookTarget = Assert<Equal<Parameters<ReturnType<typeof useInfiniteSentinel>["ref"]>[0], HTMLElement | null>>;
type HookIsError = Assert<Equal<ReturnType<typeof useInfiniteSentinel>["isError"], boolean>>;
type HookError = Assert<Equal<ReturnType<typeof useInfiniteSentinel>["error"], unknown>>;
type RenderIsError = Assert<Equal<LoadMoreState["isError"], boolean>>;
type RenderError = Assert<Equal<LoadMoreState["error"], unknown>>;

const onLoadMore = async () => ["page"];
const div = <LoadMore ref={createRef<HTMLDivElement>()} onLoadMore={onLoadMore} hasMore />;
const button = (
  <LoadMore.button type="button" ref={createRef<HTMLButtonElement>()} onLoadMore={onLoadMore} hasMore>
    {({ isIntersecting, isLoading, isError, error, retry }) => (
      <span onClick={retry}>{String(isError)}:{String(error)}:{String(isIntersecting)}:{String(isLoading)}</span>
    )}
  </LoadMore.button>
);

export type LoadMoreReact18Contract = DivRef | ButtonRef | WrongRef | RequiredHasMore | BadCallback | HookTarget |
  HookIsError | HookError | RenderIsError | RenderError;
export { div, button };
