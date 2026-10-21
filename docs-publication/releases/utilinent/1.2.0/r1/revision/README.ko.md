# @ilokesto/utilinent

[English](./README.md) | **한국어**

[![Build Size](https://img.shields.io/bundlephobia/minzip/@ilokesto/utilinent?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=@ilokesto/utilinent)
[![Version](https://img.shields.io/npm/v/@ilokesto/utilinent?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@ilokesto/utilinent)
[![Downloads](https://img.shields.io/npm/dt/@ilokesto/utilinent.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@ilokesto/utilinent)

## 문서

- 전체 문서: [English](https://ilokesto.ayden94.com/en/utilinent) · [한국어](https://ilokesto.ayden94.com/ko/utilinent)
- 소스: [packages/utilinent](https://github.com/ilokesto/ilokesto/tree/main/packages/utilinent)
- npm: [@ilokesto/utilinent](https://www.npmjs.com/package/@ilokesto/utilinent)

React 앱이 커질수록 JSX는 중첩 삼항 연산자와 비대해진 map 콜백으로 금방 어수선해지고, 가독성이 빠르게 떨어집니다. utilinent는 이런 반복적인 UI 패턴을 작고 선언적인 컴포넌트로 풀어내기 위해 만들어졌습니다.

간결하고 표현력 있는 SolidJS 스타일에서 착안해, utilinent는 조건부 렌더링·리스트 렌더링·지연 로딩 같은 흔한 작업을 명확한 API로 캡슐화합니다. 복잡한 삼항 연산자는 `Show` 컴포넌트로 대체하고, 배열은 빈 데이터용 fallback이 내장된 `For`로 렌더링할 수 있습니다.

시끄러운 로직을 뷰 밖으로 옮겨 재사용 가능한 컴포넌트로 만들면 가독성과 유지보수성이 좋아지고, 개발자가 비즈니스 로직에 더 집중할 수 있어 팀 생산성도 올라갑니다.

## 설치

utilinent는 아래 방법 중 하나로 설치할 수 있습니다.

```bash
npm install @ilokesto/utilinent
pnpm add @ilokesto/utilinent
yarn add @ilokesto/utilinent
bun add @ilokesto/utilinent
```

## 빠른 시작

React에서 비동기 데이터를 다룰 때는 loading·empty·populated 상태에 따라 다른 UI를 렌더링하는 일이 흔합니다. 아래 예시는 일반적인 패턴과, utilinent 컴포넌트가 그 패턴을 어떻게 단순화하는지 보여줍니다.

```tsx
import React, { useState, useEffect } from 'react';

const UserList = () => {
  const { data: users } = useQuery( ... )

  return (
    <div>
      <h2>User List</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        users.length > 0 ? (
          <ul>
            {users.map(user => (
              <li key={user.id}>{user.name}</li>
            ))}
          </ul>
        ) : (
          <p>No users found.</p>
        )
      )}
    </div>
  );
};

export default UserList;
```

utilinent의 `Show`와 `For` 컴포넌트는 조건부 렌더링과 리스트 렌더링을 더 선언적이고 간결하게 만듭니다. loading·리스트 상태를 명확하게 표현해 UI 의도를 읽고 유지하기 쉬워집니다.

```tsx
import React, { useState, useEffect } from 'react';
import { Show, For } from '@ilokesto/utilinent';

const UserListAfter = () => {
  const { data: users } = useQuery( ... )

  return (
    <div>
      <h2>User List</h2>
      <Show when={!loading} fallback={<p>Loading users...</p>}>
        <For.ul each={users} fallback={<p>No users found.</p>}>
          {(user) => (
            <li key={user.id}>{user.name}</li>
          )}
        </For.ul>
      </Show>
    </div>
  );
};

export default UserListAfter;
```

## Mount 비동기 계약

`Mount`는 Promise가 아닌 React 노드를 직접 받습니다. 비동기 작업은 팩토리로 전달해야 하며, 그래야 React 18과 React 19 타입에서 계약이 동일하게 유지됩니다.

```tsx
import { Mount } from '@ilokesto/utilinent';

<Mount fallback={<p>Loading preview...</p>} onError={reportError}>
  {() => loadPreview().then((preview) => <Preview data={preview} />)}
</Mount>
```

`Promise`와 `PromiseLike`를 자식으로 직접 전달하는 것은 의도적으로 거부됩니다. 팩토리는 노드를 동기로 반환하거나 노드의 `Promise`를 반환할 수 있습니다.

## 커스텀 프록시 컴포넌트

`Show` 스타일의 컴포넌트(예: `Clickable`)를 직접 만들고 싶다면, 저장소에 짧은 가이드가 있습니다:

- [`CUSTOM_CLICKABLE.md`](./CUSTOM_CLICKABLE.md)
