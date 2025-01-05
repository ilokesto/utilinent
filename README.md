[![Build Size](https://img.shields.io/bundlephobia/minzip/utilinent?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=utilinent)
[![Version](https://img.shields.io/npm/v/utilinent?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/utilinent)
[![Downloads](https://img.shields.io/npm/dt/utilinent.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/utilinent)

# Utilinent

utilinent[ˈjuːtɪlɪnənt]는 SolidJS에서 제공하는 간결하고 직관적인 API 디자인 철학을 React 환경에 도입하여, 개발자들이 더욱 생산적이고 효율적으로 작업할 수 있도록 돕는 것을 목표로 합니다.

React는 JSX 문법을 통해 컴포넌트를 선언적으로 작성할 수 있도록 합니다. 그러나 조건부 랜더링 ─ 삼항 연산자나 AND 연산자 등 ─ 을 사용하는 경우 중첩된 코드가 복잡해지고 유지보수가 어려워질 수 있습니다. 이러한 상황에 대해 utilinent는 로직을 컴포넌트로 감싸는 접근법을 제공하여 재사용성이 높고 가독성 좋은 컴포넌트를 작성할 수 있도록 돕습니다.

&nbsp;

# install 및 import 

```ts
npm i utilinent
```
```ts
import { Show, For, Switch, Match, Mount } from "utilinent"
```

&nbsp;

# Show

React에서 조건부 렌더링을 다룰 때 삼항 연산자, AND(&&) 또는 OR(||) 연산자를 사용하면 코드가 복잡해지거나 가독성이 떨어질 수 있습니다. 개발자마다 선호하는 방식이 다르고, 프로젝트 컨벤션을 따르더라도 코드 스타일의 일관성이 깨질 수 있습니다.

```tsx
// 삼항 연산자
{ isLoggedIn ? <UserProfile /> : <LoginButton /> }
 
// AND 연산자
{ isLoading && <Spinner /> }
 
// OR 연산자
{ value || <DefaultValue /> }
```
Show 컴포넌트는 조건(when)에 따라 자식 요소(children)를 렌더링하거나, 조건이 충족되지 않을 경우 대체 콘텐츠(fallback)를 렌더링합니다. Show 컴포넌트를 사용하면 조건부 렌더링 방식을 하나로 통일할 수 있어 프로젝트 전체의 코드 스타일을 일관되게 유지하며, 협업과 코드의 가독성, 유지보수성을 개선할 수 있습니다.

```tsx
function Show<T>({
  when: T;
  children: ReactNode | ((item: T) => ReactNode);
  fallback?: ReactNode;
}): ReactNode
 
// 삼항 연산자 대체
<Show when={isLoggedIn} fallback={<LoginButton />}>
  <UserProfile />
</Show>
 
// AND 연산자 대체
<Show when={isLoading}>
  <Spinner />
</Show>
 
// OR 연산자 대체
<Show when={value} fallback={<DefaultValue />}>
  {(item) => item}
</Show>
```

&nbsp;

# For 
React에서 배열을 렌더링할 때 흔히 사용하는 방식은 Array.prototype.map 메서드입니다. 이 방식은 배열의 각 요소를 순회하며 렌더링할 수 있는 강력한 도구지만, 몇 가지 단점도 존재합니다. JSX 코드와 배열 순회 로직이 밀접하게 얽혀 있어 코드가 복잡해지고, 특히 빈 배열을 처리해야 할 경우 추가적인 조건문이 필요해 가독성과 유지보수성이 떨어질 수 있습니다.

For 컴포넌트를 사용하면 이러한 문제를 간단히 해결할 수 있습니다. For 컴포넌트는 배열 렌더링과 빈 배열 처리를 간소화하며, 선언적인 코드 작성 방식을 지원하는 강력한 도구입니다. For 컴포넌트를 사용하면, each가 빈 배열이거나 undefined 또는 null일 경우, fallback 속성을 통해 대체 콘텐츠를 간편하게 정의할 수 있습니다.

```tsx
function For<T extends Array<unknown>>({
  each: T | null | undefined; 
  fallback?: ReactNode;
  children: (item: T[number], index: number) => ReactNode;
}): ReactNode
```
each props에 제공된 값이 Array | undefined | null 타입인 경우에도 For 컴포넌트는 이를 안전하게 처리할 수 있습니다. 리액트 쿼리의 동작 원리로 인해, 아래의 예시에서 useQuery가 리턴하는 data: userList의 타입은 Array<User>일 수도, undefined일 수도 있습니다. For 컴포넌트는 userList가 undefined일 경우, 지정된 fallback 콘텐츠를 렌더링하여 오류를 방지합니다.

```tsx
// type of users is Array<{ id: number, name: string }> | undefined
const { data: userList } = useQuery({ ... })
 
<Map each={userList} fallback={<p>No users available.</p>}>
  {({ id, name }) => <p key={id}>User: {name}</p>}
</Map>
```

# Switch & Match
여러 조건을 따라 컴포넌트를 랜더링 해야 한다면, 보통은 if문이나 switch문을 사용해 조건부 로직을 처리합니다. 하지만 이렇게 여러 조건을 관리하는 과정에서 쉽게 코드가 길어지고 복잡해지며, 이로 인해 코드의 가독성이 떨어지고 유지보수가 어려워지는 문제가 발생합니다. Switch와 Match 컴포넌트는 이러한 문제를 해결하고, 조건부 렌더링을 더 간결하고 선언적으로 처리할 수 있는 방법을 제공합니다.
 
Switch는 주어진 when 값에 맞는 첫 번째 Match 컴포넌트를 찾아 렌더링합니다. Match 컴포넌트는 case prop으로 각 조건을 정의하며, 조건에 맞는 콘텐츠를 children이나 element 중 원하는 방식으로 제공할 수 있습니다. 이를 통해 코드가 간결해지고, 조건이 많아져도 직관적으로 관리할 수 있어 가독성과 유지보수성이 크게 향상됩니다.
 
Switch 컴포넌트를 사용할 때는 주의해야할 점이 있습니다. Switch 컴포넌트의 Children에는 Match 컴포넌트만 넘겨줄 수 있으며, 이때 Match 컴포넌트의 갯수는 반드시 둘 이상이어야 합니다.

```tsx
type Case = string | number | boolean | null | undefined;
 
function Switch({
  children: Array<ReactElement>,
  when: Case,
  fallback?: ReactNode
}): ReactNode
 
function Match({
  case: Case,
  children: ReactNode,
  element?: never
} | {
  case: Case,
  children?: never,
  element: ReactNode
}): ReactNode
```

아래의 예시 코드에서 볼 수 있듯, Switch & Match 컴포넌트를 사용하면 여러 조건을 훨씬 간단하게 처리할 수 있습니다. 복잡한 JSX를 렌더링해야 할 경우에는 children으로 전달하고, 외부에서 컴포넌트를 import 하거나 간단한 JSX를 사용할 경우에는 element로 전달하여 Match를 한 줄로 처리할 수 있습니다. 이를 통해 코드가 더 깔끔하고 유지보수하기 쉬운 방식으로 작성됩니다.

```tsx
export function SearchTitle(props: { searchType: SearchType, keyword: string }) {
  switch (props.searchType) {
    case "report":
      return <SearchReport />
 
    case "book":
      return <SearchBook />;
 
    case "tag":
      return <SearchTag />;
  }
};
 
export function SearchTitle(props: { searchType: SearchType, keyword: string }) {
  return (
    <Switch when={props.searchType}>
      <Match case="report" element={<SearchReport />} />
      <Match case="book" element={<SearchBook />} />
      <Match case="tag" element={<SearchTag />} />
    </Switch>
  )
};
```

Switch와 Match 컴포넌트를 아래와 같은 방식으로도 사용할 수도 있기는 합니다. 하지만 각 Match 컴포넌트의 case 값이 고유하다는 것을 보장할 수 없다면 반드시 다른 접근 방식을 취해야 합니다. 이는 중복된 case 값이 있을 경우 어떤 조건이 우선적으로 평가될지 보장할 수 없기 때문입니다.

개발자는 각 Match 컴포넌트의 case 값을 명확하고 고유하게 정의하여 예측 가능한 동작을 유지해야 합니다. 이를 위반하면 코드의 가독성과 안정성이 저하될 수 있으므로 각별한 주의가 필요합니다.

```tsx
type CompProps = {
  state: {
    done: boolean | null;
    loading: boolean | null;
    error: boolean | null;
  }
}
 
export default function Comp({ state }: CompProps) => {
  return (
    <Switch when={true}>
      <Match case={state.done} element={<BaseComp />}
      <Match case={state.loading} element={<Loading />} />
      <Match case={state.error} element={<Error />} />
    </Switch>
  )
};
```

&nbsp;

# Mount
React에서 클라이언트 측 렌더링만 필요한 UI를 다룰 때, DOM에 마운트된 이후에만 특정 코드를 실행하거나 UI를 렌더링해야 하는 경우가 있습니다. 예를 들어, 브라우저 전용 API를 사용하거나 DOM 의존성이 있는 외부 라이브러리를 초기화할 때, 서버 측 렌더링 환경에서 이를 처리하지 않도록 해야 하는데, 일반적으로는 useEffect 훅과 상태 변수를 사용하여 이를 관리합니다.

```tsx
import { useEffect, useState } from "react";
 
function MyComponent() {
  const [isMounted, setIsMounted] = useState(false);
 
  useEffect(() => {
    setIsMounted(true);
  }, []);
 
  if (!isMounted) {
    return null; // 마운트되기 전에는 아무것도 렌더링하지 않음
  }
 
  return <div>클라이언트에서만 보이는 콘텐츠</div>;
}
```
Next.js 개발자라면 아마도 위와 같은 패턴을 몇 번이고 작성해보았을 것입니다. 이처럼 동일한 패턴을 반복하여 작성하다 보니, 코드가 불필요하게 중복되고, 관리하기 어려워지는 경우가 많습니다. 특히 여러 컴포넌트에서 동일한 로직을 구현해야 할 때, 코드의 가독성이나 유지보수성이 떨어지게 됩니다.

이런 문제를 해결하기 위해 Mount 컴포넌트를 활용하면, 이 과정을 한 번에 추상화하여 간결하고 재사용 가능한 형태로 관리할 수 있습니다.


```tsx
function Mount({
  children: ReactNode,
  fallback?: ReactNode
}): ReactNode
```

필요하다면 Mount 컴포넌트에도 fallback prop을 제공하여 컴포넌트가 마운트되기 전까지 보여줄 대체 콘텐츠를 지정할 수 있습니다. 이렇게 하면 로딩 상태나 다른 UI 상태를 처리하는 데에도 유용하며, 컴포넌트가 마운트되지 않은 상태에서는 fallback 콘텐츠가 표시되므로 사용자 경험을 향상시킬 수 있습니다.

```tsx
import { Mount } from "./Mount";
 
function MyComponent() {
  return (
    <Mount fallback={<p>Loading...</p>}>
      <div>클라이언트에서만 보이는 콘텐츠</div>
    </Mount>
  );
}
```

앞서 언급된 다른 유틸리티 컴포넌트들과 달리 Mount 컴포넌트는 내부적으로 state를 사용하기에 Next.js의 app router에서는 클라이언트 컴포넌트로 취급됩니다.
