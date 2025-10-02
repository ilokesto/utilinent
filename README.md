# @ilokesto/utilinent

React를 위한 유용하고 재사용 가능한 컴포넌트 및 훅 모음입니다.

## 소개

`@ilokesto/utilinent`는 React 애플리케이션 개발 시 반복적으로 필요한 로직과 패턴을 선언적이고 읽기 쉬운 컴포넌트로 제공합니다. 조건부 렌더링, 리스트 렌더링, 지연 로딩 등의 작업을 간편하게 처리할 수 있도록 돕습니다.

## 설치

```bash
npm install @ilokesto/utilinent
# 또는
yarn add @ilokesto/utilinent
# 또는
pnpm add @ilokesto/utilinent
```

## 주요 기능

### 기본 컴포넌트

기본적으로 다음 컴포넌트들을 가져와 사용할 수 있습니다.

```tsx
import { Show, For, Repeat, Observer, OptionalWrapper, useIntersectionObserver } from '@ilokesto/utilinent';
```

#### `<Show>`

조건부 렌더링을 위한 컴포넌트입니다. `when` prop이 `true`일 때만 `children`을 렌더링합니다.

또한, `Show.div`, `Show.span`과 같이 HTML 태그를 직접 사용하여 래퍼(wrapper) 컴포넌트를 지정할 수 있습니다. 이 경우, `when` prop이 `true`일 때 해당 태그로 감싸진 `children`이 렌더링됩니다.

**사용 예시:**

```tsx
import { Show } from '@ilokesto/utilinent';

function UserProfile({ user }) {
  return (
    <div>
      <Show when={user.isLoggedIn} fallback={<div>로그인이 필요합니다.</div>}>
        <h1>{user.name}님, 환영합니다!</h1>
      </Show>

      {/* HTML 태그와 함께 사용 */}
      <Show.div when={user.isAdmin} className="admin-badge">
        관리자
      </Show.div>
    </div>
  );
}
```

#### `<For>`

배열을 순회하며 각 항목을 렌더링합니다. `Array.prototype.map`과 유사하지만, 배열이 비어있을 경우를 위한 `fallback`을 지원합니다.

`<Show>`와 유사하게, `For.ul`, `For.div`와 같이 HTML 태그를 사용하여 렌더링되는 항목들을 감싸는 컨테이너 엘리먼트를 지정할 수 있습니다.

**사용 예시:**

```tsx
import { For } from '@ilokesto/utilinent';

function TodoList({ todos }) {
  return (
    <For.ul each={todos} fallback={<li>할 일이 없습니다.</li>} className="todo-list">
      {(todo, index) => <li key={index}>{todo.text}</li>}
    </For.ul>
  );
}
```

#### `<Repeat>`

주어진 횟수(`times`)만큼 `children` 함수를 반복하여 렌더링합니다.

다른 컴포넌트들과 마찬가지로, `Repeat.div`와 같이 HTML 태그를 사용하여 반복되는 항목들을 감싸는 컨테이너를 지정할 수 있습니다.

**사용 예시:**

```tsx
import { Repeat } from '@ilokesto/utilinent';

function StarRating({ rating }) {
  return (
    <Repeat.div times={rating} className="star-container">
      {(index) => <span key={index}>⭐️</span>}
    </Repeat.div>
  );
}
```

#### `<Observer>`

컴포넌트가 화면에 보일 때(intersect) `children`을 렌더링합니다. Intersection Observer API를 기반으로 하며, 지연 로딩(lazy loading) 구현에 유용합니다.

**사용 예시:**

```tsx
import { Observer } from '@ilokesto/utilinent';

function LazyComponent() {
  return (
    <Observer fallback={<div>로딩 중...</div>}>
      {/* 화면에 보일 때 렌더링될 무거운 컴포넌트 */}
      <HeavyComponent />
    </Observer>
  );
}
```

#### `<OptionalWrapper>`

`when` prop이 `true`일 때만 `children`을 `wrapper` 함수로 감싸줍니다.

**사용 예시:**

```tsx
import { OptionalWrapper } from '@ilokesto/utilinent';

function Post({ post, withLink }) {
  return (
    <OptionalWrapper
      when={withLink}
      wrapper={(children) => <a href={`/posts/${post.id}`}>{children}</a>}
    >
      <h2>{post.title}</h2>
      <p>{post.summary}</p>
    </OptionalWrapper>
  );
}
```

### 훅(Hooks)

#### `useIntersectionObserver`

Intersection Observer API를 React 훅으로 감싼 것입니다. 컴포넌트의 뷰포트 내 가시성을 추적하는 데 사용됩니다.

**사용 예시:**

```tsx
import { useIntersectionObserver } from '@ilokesto/utilinent';
import { useRef } from 'react';

function MyComponent() {
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });

  return (
    <div ref={ref} style={{ transition: 'opacity 0.5s', opacity: isIntersecting ? 1 : 0.2 }}>
      {isIntersecting ? '이제 화면에 보입니다!' : '화면 밖에 있습니다.'}
    </div>
  );
}
```

### 실험적 기능

실험적인 컴포넌트 및 훅은 `experimental` 경로에서 가져올 수 있습니다. 이 기능들은 API가 변경될 수 있습니다.

```tsx
import { Mount, Slacker, createSwitcher, Slot, Slottable } from '@ilokesto/utilinent/experimental';
```

#### `<Slot>` 및 `<Slottable>`

자식 컴포넌트에 props를 전달하고 병합하는 Radix UI의 `<Slot>`과 유사한 패턴을 구현합니다. `<Slot>`은 자신의 props를 자식 요소에 병합합니다. 여러 자식 중 특정 자식에게 props를 전달하고 싶을 때는 `<Slottable>`로 감싸주면 됩니다.

Props 병합 규칙은 다음과 같습니다:
*   **`className`**: 부모와 자식의 `className`이 합쳐집니다.
*   **`style`**: 부모와 자식의 `style` 객체가 병합됩니다 (부모 우선).
*   **이벤트 핸들러**: 부모와 자식의 이벤트 핸들러가 모두 순차적으로 호출됩니다.
*   **`ref`**: 부모와 자식의 `ref`가 모두 연결됩니다.
*   **기타 props**: 부모의 props가 자식의 props를 덮어씁니다.

**사용 예시:**

```tsx
import { Slot, Slottable } from '@ilokesto/utilinent/experimental';

const Button = ({ asChild = false, ...props }) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp {...props} />;
};

// 기본 버튼으로 사용
<Button onClick={() => alert('Clicked!')}>Click Me</Button>

// 다른 컴포넌트(a 태그)를 렌더링하면서 props를 전달
<Button asChild>
  <a href="/home">Go Home</a>
</Button>

// 여러 자식 중 특정 자식에게 props 전달
<Button asChild>
  <div>
    <span>Icon</span>
    <Slottable>Text</Slottable>
  </div>
</Button>
```

#### `<Mount>`

컴포넌트가 마운트될 때 비동기적으로 `children`을 렌더링합니다. `children`으로 비동기 함수를 전달할 수 있습니다.

**사용 예시:**

```tsx
import { Mount } from '@ilokesto/utilinent/experimental';

function AsyncComponent() {
  return (
    <Mount fallback={<div>로딩 중...</div>}>
      {async () => {
        const { HeavyComponent } = await import('./HeavyComponent');
        return <HeavyComponent />;
      }}
    </Mount>
  );
}
```

#### `<Slacker>`

컴포넌트나 데이터의 지연 로딩(lazy loading)을 위한 고급 컴포넌트입니다. 뷰포트에 들어왔을 때 `loader` 함수를 실행하여 비동기 작업을 처리하고, 로딩이 완료되면 결과를 `children`에게 전달하여 렌더링합니다.

**사용 예시:**

```tsx
import { Slacker } from '@ilokesto/utilinent/experimental';

// 데이터 지연 로딩
function LazyUserData({ userId }) {
  return (
    <Slacker
      fallback={<div>사용자 정보 로딩 중...</div>}
      loader={async () => {
        const response = await fetch(`/api/users/${userId}`);
        return response.json();
      }}
    >
      {(user) => (
        <div>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
      )}
    </Slacker>
  );
}
```

#### `createSwitcher` / `<Switch>` / `<Match>`

주어진 데이터와 조건에 따라 여러 `<Match>` 컴포넌트 중 하나를 선택하여 렌더링합니다. `createSwitcher` 팩토리 함수를 통해 `<Switch>`와 `<Match>` 컴포넌트를 생성하여 사용합니다.

**사용 예시:**

```tsx
import { createSwitcher } from '@ilokesto/utilinent/experimental';

const data = { type: 'image', src: 'image.jpg' };
const { Switch, Match } = createSwitcher(data);

function Media() {
  return (
    <Switch when="type" fallback={<div>지원하지 않는 형식입니다.</div>}>
      <Match case="image">
        {(data) => <img src={data.src} />}
      </Match>
      <Match case="video">
        {(data) => <video src={data.src} controls />}
      </Match>
    </Switch>
  );
}
```

## 라이선스

[MIT](./LICENSE)
