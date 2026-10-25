# @ilokesto/utilinent

조건부 렌더링, 리스트, 비동기 UI를 간결하게 표현하는 작은 React 컴포넌트 모음입니다.

[![npm](https://img.shields.io/npm/v/@ilokesto/utilinent?style=flat&color=555)](https://www.npmjs.com/package/@ilokesto/utilinent)
[![License: MIT](https://img.shields.io/badge/license-MIT-555?style=flat)](https://opensource.org/license/mit)

[문서](https://ilokesto.ayden94.com/ko/utilinent) | [API](./docs/reference) | [English](./README.md)

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
취소와 오류 처리는 [Mount 계약](./docs/reference/mount.ko.mdx)을 참고하세요.

## 더 알아보기

- [시작하기](./docs/quick-start.ko.mdx)
- [리스트와 빈 상태](./docs/guides/list-and-empty-states.ko.mdx)
- [커스텀 프록시 컴포넌트](./docs/guides/custom-proxy-components.ko.mdx)
- [훅](./docs/reference/use-event-listener.ko.mdx) — `@ilokesto/utilinent/hooks`에서도 가져올 수 있습니다.

<details>
<summary>개발</summary>

이 저장소에서 Node 22와 pnpm 10.17.1을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm test:react18
pnpm test:browser
pnpm typecheck:react19
pnpm test:tooling
pnpm migrate:verify
pnpm docs:publication:verify
pnpm docs:typecheck
pnpm docs:build
pnpm docs:test
```

[브라우저 테스트](./BROWSER_TESTING.md)와 [React 런타임 테스트](./REACT_RUNTIME_TESTING.md)를 참고하세요.
PR은 Verify CI를 실행합니다. main 병합은 Changesets 릴리스 PR을 생성·갱신하며,
릴리스 PR을 병합하면 GitHub Actions가 성공한 Verify의 정확한 아티팩트만 게시합니다.
적용 전에 `Allow GitHub Actions to create and approve pull requests`를 켜고
`Production` 환경에 `NPM_TOKEN`을 설정하세요. 로컬 게시나 문서 배포는 하지 않습니다.

</details>

MIT 라이선스입니다.
