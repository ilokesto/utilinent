# @ilokesto/utilinent

조건부 렌더링, 리스트, 비동기 UI를 간결하게 표현하는 작은 React 컴포넌트 모음입니다.

[![npm](https://img.shields.io/npm/v/@ilokesto/utilinent?style=flat&color=555)](https://www.npmjs.com/package/@ilokesto/utilinent)
[![License: MIT](https://img.shields.io/badge/license-MIT-555?style=flat)](https://opensource.org/license/mit)

[English](./README.md)

- **읽기 쉬운 JSX** — `Show`, `For`, `Switch` / `Match`로 렌더링 의도를 표현합니다.
- **비동기 렌더링** — `Mount`, 지연 로딩, 명시적인 fallback을 제공합니다.
- **컴포넌트와 훅** — 브라우저 이벤트, 가시성, 레이아웃을 다룹니다.

## 설치

```sh
pnpm add @ilokesto/utilinent
```

React 18 또는 19가 필요합니다.

## 빠른 시작

```tsx
import { For, Show } from '@ilokesto/utilinent';

type User = { id: string; name: string };

export function UserList({
  users,
  loading,
}: {
  users: User[];
  loading: boolean;
}) {
  return (
    <Show when={!loading} fallback={<p>Loading users...</p>}>
      <For.ul each={users} fallback={<li>No users found.</li>}>
        {(user) => <li key={user.id}>{user.name}</li>}
      </For.ul>
    </Show>
  );
}
```

비동기 렌더링에서는 `Mount`에 Promise를 직접 넘기지 말고 **팩토리 함수**를 전달하세요.
비동기 작업에는 취소와 오류 처리를 적용하세요.

## 구분 요소가 있는 리스트

`Separated`에 배열은 `each`, 구분 요소는 `by`, 항목 렌더 함수는 children으로 전달합니다.

```tsx
import { Separated } from '@ilokesto/utilinent';

<Separated each={['hello', 'react', 'world']} by={<hr />}>
  {(item) => <div key={item}>{item}</div>}
</Separated>
```

별도 래퍼 없이 `hello`, 구분 요소, `react`, 구분 요소, `world` 순서로 렌더링합니다. 배열 prop은 기존 `For`와 동일하게 `each`를 사용하며, 일반 배열과 readonly 배열을 모두 받습니다. 렌더 함수는 타입이 추론된 항목과 원래 배열의 인덱스 `(item, index)`를 받습니다.

- 빈 배열은 아무것도 렌더링하지 않고, 렌더 결과가 하나면 구분 요소를 넣지 않습니다.
- `null`, `undefined`, boolean 결과는 제외한 뒤 구분 요소를 삽입합니다. 문자열(빈 문자열 포함)과 숫자는 유지합니다.
- 반환된 배열은 개별 노드로 펼칩니다. Fragment와 컴포넌트는 내부를 확인하지 않는 단일 노드이므로, 화면에 아무것도 표시하지 않더라도 구분 대상입니다. 항목을 제외하려면 입력 배열을 필터링하거나 렌더 함수에서 직접 `null`을 반환하세요.
- 항목의 순서나 개수가 바뀔 수 있다면 렌더링하는 요소에 안정적인 key를 지정하세요. key가 없는 노드는 위치로 식별하며, 구분 요소는 뒤따르는 노드와 식별자를 공유합니다.
- 래퍼, DOM props, 전달된 ref가 필요하면 `<Separated.div each={items} by={<hr />}>` 같은 태그 변형을 사용하세요. 사용자 정의 변형은 `separated` 플러그인 카테고리를 사용합니다.

<details>
<summary>개발</summary>

이 저장소에서 Node 24.22.1과 pnpm 10.17.1을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm typecheck
pnpm test
```

`pnpm test` builds once and runs `test:unit`, `test:types` (including `test:types:react19`), `test:tooling`, `test:react18`, and `test:browser`. `pnpm typecheck` checks library source only. Standalone declaration checks require a prior build. Tests live under `tests/{unit,types,tooling,browser,fixtures}`.


[브라우저 테스트](./BROWSER_TESTING.md)와 [React 런타임 테스트](./REACT_RUNTIME_TESTING.md)를 참고하세요.
PR은 Verify CI를 실행합니다. main 병합은 Changesets 릴리스 PR을 생성·갱신하며,
릴리스 PR을 병합하면 GitHub Actions가 성공한 Verify의 정확한 아티팩트만 게시합니다.
적용 전에 `Allow GitHub Actions to create and approve pull requests`를 켜고
`Production` 환경에 `NPM_TOKEN`을 설정하세요. 로컬 게시는 하지 않습니다.

</details>

MIT 라이선스입니다.
