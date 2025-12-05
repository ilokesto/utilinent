
import { Fallback } from ".";
import { HtmlTag } from "../constants/htmlTags";

export interface ForProps<T extends Array<unknown>> extends Fallback {
  each: T | null | undefined; // 배열 또는 null/undefined 허용
  children: (item: T[number], index: number) => React.ReactNode;
  before?: React.ReactNode;
  after?: React.ReactNode;
}

type ForTagHelper<K extends HtmlTag> = {
  <const T extends Array<unknown>>(props: ForProps<T> & Omit<React.ComponentPropsWithRef<K>, 'children'>): React.ReactNode;
};

export type ForType = {
    <const T extends Array<unknown>>(props: ForProps<T>): React.ReactNode;
} & {
    [K in HtmlTag]: ForTagHelper<K>;
};