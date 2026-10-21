'use client';

import { For, Match, Show, Switch } from '@ilokesto/utilinent';
import { useRef, useState } from 'react';
import {
    DemoFrame,
    type DemoProps,
    demoButtonClass,
    demoSecondaryButtonClass,
} from './demo-frame';

type DemoItem = { readonly id: number; readonly label: string };

const copy = {
  en: {
    title: 'Compose conditional and list states',
    description:
      'Use Show, For, and Switch to express hidden, empty, and populated UI branches without nested ternaries.',
    hide: 'Hide list',
    show: 'Show list',
    add: 'Add item',
    remove: 'Remove',
    reset: 'Reset',
    hidden: 'The list is hidden.',
    empty: 'The list is visible but empty.',
    populated: 'The list has items.',
    emptyList: 'No demo items yet.',
    result: 'Current branch',
    initial: ['Write accessible markup', 'Handle empty states'],
    added: 'Demo item',
  },
  ko: {
    title: '조건부 상태와 목록 상태 조합하기',
    description:
      'Show, For, Switch로 중첩 삼항 연산자 없이 숨김, 빈 목록, 채워진 목록 분기를 표현하세요.',
    hide: '목록 숨기기',
    show: '목록 보이기',
    add: '항목 추가',
    remove: '삭제',
    reset: '초기화',
    hidden: '목록이 숨겨져 있습니다.',
    empty: '목록이 보이지만 비어 있습니다.',
    populated: '목록에 항목이 있습니다.',
    emptyList: '아직 데모 항목이 없습니다.',
    result: '현재 분기',
    initial: ['접근 가능한 마크업 작성', '빈 상태 처리'],
    added: '데모 항목',
  },
} as const;

const snippet = `const [visible, setVisible] = useState(true);
const [items, setItems] = useState(initialItems);

<Switch fallback={<p>Unknown state</p>}>
  <Match when={!visible}><p>The list is hidden.</p></Match>
  <Match when={items.length === 0}><p>The list is empty.</p></Match>
  <Match when={items}><p>The list has items.</p></Match>
</Switch>

<Show when={visible} fallback={<p>The list is hidden.</p>}>
  <ul>
    <For each={items} fallback={<li>No demo items yet.</li>}>
      {(item) => <li key={item.id}>{item.label}</li>}
    </For>
  </ul>
</Show>`;

function initialItems(lang: DemoProps['lang']): DemoItem[] {
  return copy[lang].initial.map((label, index) => ({ id: index + 1, label }));
}

export function UtilinentDemo({ lang }: DemoProps) {
  const text = copy[lang];
  const [visible, setVisible] = useState(true);
  const [items, setItems] = useState<DemoItem[]>(() => initialItems(lang));
  const nextId = useRef(3);

  const addItem = () => {
    const id = nextId.current;
    nextId.current += 1;
    setItems((current) => [...current, { id, label: `${text.added} ${id}` }]);
  };

  const reset = () => {
    nextId.current = 3;
    setVisible(true);
    setItems(initialItems(lang));
  };

  return (
    <DemoFrame lang={lang} name="utilinent" title={text.title} description={text.description} code={snippet}>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          className={demoButtonClass}
          data-action="toggle-list"
          aria-pressed={!visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? text.hide : text.show}
        </button>
        <button
          type="button"
          className={demoSecondaryButtonClass}
          data-action="add-item"
          onClick={addItem}
        >
          {text.add}
        </button>
        <button
          type="button"
          className={demoSecondaryButtonClass}
          data-action="reset"
          disabled={visible && items.length === 2 && nextId.current === 3}
          onClick={reset}
        >
          {text.reset}
        </button>
      </div>

          <div
        className="space-y-2"
        data-result="utilinent-branch"
        data-state={!visible ? 'hidden' : items.length === 0 ? 'empty' : 'populated'}
        aria-live="polite"
      >
        <p className="mb-2 text-xs font-semibold text-fd-muted-foreground">{text.result}</p>
        <Switch fallback={<p className="text-sm text-fd-muted-foreground">-</p>}>
          <Match when={!visible}>
            <p className="text-sm font-medium text-fd-foreground">{text.hidden}</p>
          </Match>
          <Match when={items.length === 0}>
            <p className="text-sm font-medium text-fd-foreground">{text.empty}</p>
          </Match>
          <Match when={items}>
            <p className="text-sm font-medium text-fd-foreground">{text.populated}</p>
          </Match>
        </Switch>
      </div>

      <Show
        when={visible}
        fallback={
          <p className="py-3 text-sm text-fd-muted-foreground">
            {text.hidden}
          </p>
        }
      >
        <ul className="space-y-2" data-result="utilinent-list">
          <For
            each={items}
            fallback={
              <li className="py-3 text-sm text-fd-muted-foreground">
                {text.emptyList}
              </li>
            }
          >
            {(item) => (
              <li
                key={item.id}
                className="flex min-w-0 items-center justify-between gap-3 border-b border-fd-border py-2 last:border-0"
              >
                <span className="min-w-0 break-words text-sm text-fd-foreground">{item.label}</span>
                <button
                  type="button"
                  className={demoSecondaryButtonClass}
                  data-action="remove-item"
                  aria-label={`${text.remove}: ${item.label}`}
                  onClick={() => setItems((current) => current.filter(({ id }) => id !== item.id))}
                >
                  {text.remove}
                </button>
              </li>
            )}
          </For>
        </ul>
          </Show>
        </div>
    </DemoFrame>
  );
}
