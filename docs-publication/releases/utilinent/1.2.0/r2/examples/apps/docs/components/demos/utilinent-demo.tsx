'use client';

import { For, Match, Show, Switch } from '@ilokesto/utilinent';
import { useState } from 'react';
import styles from '../landings/store-landing.module.css';
import {
  DemoFrame,
  type DemoProps,
  demoButtonClass,
  demoSecondaryButtonClass,
} from './demo-frame';

const copy = {
  en: {
    title: 'Keep a release checklist',
    description:
      'Add up to three tasks, finish them, or hide the list. Show, For, and Switch handle each state.',
    hide: 'Hide list',
    show: 'Show list',
    add: 'Add task',
    remove: 'Done',
    reset: 'Reset',
    hidden: 'Checklist hidden.',
    empty: 'All tasks done.',
    populated: 'Tasks left to finish.',
    emptyList: 'All clear. Add a task to start again.',
    tasks: ['Review pull request', 'Run package tests', 'Write release notes'],
  },
  ko: {
    title: '릴리스 체크리스트 관리하기',
    description:
      '작업을 추가하고 완료하세요. Show, For, Switch로 목록과 빈 상태를 처리합니다.',
    hide: '목록 숨기기',
    show: '목록 보이기',
    add: '작업 추가',
    remove: '완료',
    reset: '초기화',
    hidden: '체크리스트를 숨겼습니다.',
    empty: '모든 작업을 완료했습니다.',
    populated: '완료할 작업이 남아 있습니다.',
    emptyList: '모두 완료! 작업을 추가해 다시 시작하세요.',
    tasks: ['풀 리퀘스트 검토', '패키지 테스트 실행', '릴리스 노트 작성'],
  },
} as const;

const snippet = `<Switch fallback="Tasks remaining">
  <Match when={!visible}>Hidden</Match>
  <Match when={!items.length}>
    Done
  </Match>
</Switch>
<Show when={visible}>
  <For.ul each={items} fallback={empty}>
    {(item) => <li key={item.id}>
        {item.label}</li>}
  </For.ul>
</Show>`;

export function UtilinentDemo({ lang }: DemoProps) {
  const text = copy[lang];
  const [visible, setVisible] = useState(true);
  const [taskIds, setTaskIds] = useState([0, 1]);
  const tasks = text.tasks.map((label, id) => ({ id, label }));
  const items = taskIds.map((id) => tasks[id]);
  const empty = <li className="py-3 text-sm text-fd-muted-foreground">{text.emptyList}</li>;

  const addItem = () => {
    setTaskIds((current) => {
      const selected = new Set(current);
      const task = tasks.find(({ id }) => !selected.has(id));
      return task ? [...current, task.id] : current;
    });
  };

  const reset = () => {
    setVisible(true);
    setTaskIds([0, 1]);
  };

  return (
    <DemoFrame lang={lang} name="utilinent" title={text.title} description={text.description} code={snippet}>
      <div className="space-y-3">
        <div className={styles.demoToolbar}>
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
            disabled={items.length === tasks.length}
            onClick={addItem}
          >
            {text.add}
          </button>
          <button
            type="button"
            className={demoSecondaryButtonClass}
            data-action="reset"
            onClick={reset}
          >
            {text.reset}
          </button>
        </div>

        <p
          className={styles.demoStatus}
          data-result="utilinent-branch"
          data-state={!visible ? 'hidden' : items.length === 0 ? 'empty' : 'populated'}
          aria-live="polite"
        >
          <Switch fallback={text.populated}>
            <Match when={!visible}>{text.hidden}</Match>
            <Match when={!items.length}>{text.empty}</Match>
          </Switch>
        </p>

        <div className={styles.demoViewport}>
          <Show when={visible}>
            <For.ul
              each={items}
              fallback={empty}
              className="m-0 list-none p-0"
              data-result="utilinent-list"
            >
              {(item) => (
                <li
                  key={item.id}
                  className={`${styles.demoRow} justify-between border-b border-fd-border last:border-0`}
                >
                  <span className="min-w-0 break-words text-sm text-fd-foreground">{item.label}</span>
                  <button
                    type="button"
                    className={`${demoSecondaryButtonClass} shrink-0`}
                    data-action="remove-item"
                    aria-label={`${text.remove}: ${item.label}`}
                    onClick={() => setTaskIds((current) => current.filter((id) => id !== item.id))}
                  >
                    {text.remove}
                  </button>
                </li>
              )}
            </For.ul>
          </Show>
        </div>
      </div>
    </DemoFrame>
  );
}
