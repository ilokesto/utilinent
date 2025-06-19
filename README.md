[![Build Size](https://img.shields.io/bundlephobia/minzip/utilinent?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=utilinent)
[![Version](https://img.shields.io/npm/v/utilinent?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/utilinent)
[![Downloads](https://img.shields.io/npm/dt/utilinent.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/utilinent)

# Utilinent

utilinent는 SolidJS의 간결하고 직관적인 Control Flow API를 React에 도입하고 발전시켜, 개발자들이 더욱 생산적이고 효율적으로 작업할 수 있도록 돕는 것을 목표로 합니다. React에서 자주 사용되는 패턴과 조건부 렌더링 로직을 컴포넌트로 감싸는 방식으로 재사용성을 높이며, 이를 통해 대규모 프로젝트에서도 코드 스타일을 일관되게 유지할 수 있습니다. 또한, 가독성이 뛰어난 코드를 작성하고 복잡한 로직을 단순화하여 유지보수를 더욱 편리하게 만듭니다.

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

React에서 조건부 랜더링을 처리하는 방식은 삼항 연산자, 널 병합 연산자 또는 AND 연산자 등 무궁무진합니다. 이러한 다양성은 코드 스타일을 일관적으로 유지하는 것을 어렵게 만듭니다. 특히 복잡한 조건부 로직이 추가되면 코드는 중첩되고 가독성이 떨어지며, 유지보수가 어려워질 수 있습니다. Show 컴포넌트는 이러한 문제를 해결하며 대규모 프로젝트에서도 코드의 명확성과 재사용성을 동시에 고려한 일관된 접근법을 제공합니다.

```tsx
function Show<T>({
  when: T;
  fallback?: ReactNode;
  children: ReactNode | ((item: T) => ReactNode);
}): ReactNode;
```
```tsx
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
React에서 배열을 렌더링할 때 흔히 사용하는 방식은 Array.prototype.map 메서드입니다. 이 방식은 배열의 각 요소를 순회하며 렌더링할 수 있는 강력한 도구지만, 몇 가지 단점도 존재합니다. JSX 코드와 배열 순회 로직이 밀접하게 얽혀 있어 코드가 복잡해지고, 특히 빈 배열을 처리해야 할 경우 추가적인 조건문이 필요해 가독성과 유지보수성이 떨어질 수 있습니다. For 컴포넌트는 이러한 문제를 해결하고, 배열 랜더링과 빈 배열 처리를 간소화하며, 선언적인 코드 작성 방식을 지원합니다.

```tsx
function For<T extends Array<unknown>>({
  each: T | null | undefined; 
  fallback?: ReactNode;
  children: (item: T[number], index: number) => ReactNode;
}): ReactNode;
```

each에 제공된 값이 undefined 혹은 null일 경우, For 컴포넌트는 지정된 fallback 콘텐츠를 렌더링하여 오류를 방지합니다.

```tsx
// type of users is Array<{ id: number, name: string }> | undefined
const { data: userList } = useQuery({ ... })
 
<Map each={userList} fallback={<p>No users available.</p>}>
  {({ id, name }) => <p key={id}>User: {name}</p>}
</Map>
```

&nbsp;

# Switch & Match

복잡한 조건부 렌더링에서 타입 안전성을 보장하면서도 간결한 코드를 작성하는 것은 어려운 과제입니다. 특히 유니온 타입의 특정 필드 값에 따라 다른 컴포넌트를 렌더링해야 할 때, 기존의 switch문이나 조건문은 타입 추론의 한계와 코드 복잡성 문제를 야기할 수 있습니다. `createSwitchMatch`는 이러한 문제를 해결하여 타입 안전하고 선언적인 조건부 렌더링을 제공합니다.

```tsx
function createSwitchMatch<T, K extends LiteralKeys<T>>(data: T): {
  Switch: ({ 
    when: K, 
    children: Array<ReactElement>, 
    fallback?: ReactNode 
  }) => ReactNode;
  Match: <V extends ExtractValues<T, K>>({
    case: V,
    children: (props: ExtractByKeyValue<T, K, V>) => ReactNode
  }) => ReactNode;
}
```

`createSwitchMatch`는 데이터 객체를 받아 해당 객체의 구조에 맞는 Switch와 Match 컴포넌트를 생성합니다. 이렇게 생성된 컴포넌트들은 TypeScript의 타입 시스템을 활용하여 완전한 타입 안전성을 제공하며, 선택한 필드의 값에 따라 정확한 타입 추론을 수행합니다.

`createSwitchMatch`는 객체의 유니온 타입 `T`에서 리터럴 값을 가지고 있는 키를 `K`로 추출합니다. 리터럴 키가 하나만 있는 경우 자동으로 추론되지만, 여러 개가 있는 경우에는 명시적으로 타입을 지정해야 합니다.

## 케이스 1: 서로 다른 필드를 가진 유니온 타입 (K = "status")

```tsx
type ApiResponse =
  | { status: "fetching" }
  | { status: "success", message: string }
  | { status: "failed", reason: string };

function ApiStatus({ response }: { response: ApiResponse }) {
  // K는 자동으로 "status"로 추론됨
  const { Switch, Match } = createSwitchMatch(response);
  
  return (
    <Switch when="status" fallback={<div>알 수 없는 상태</div>}>
      <Match case="fetching">
        {(props) => <Spinner />} {/* props: { status: "fetching" } */}
      </Match>
      
      <Match case="success">
        {(props) => <Alert type="success">{props.message}</Alert>}
        {/* props: { status: "success", message: string } */}
      </Match>
      
      <Match case="failed">
        {(props) => <Alert type="error">{props.reason}</Alert>}
        {/* props: { status: "failed", reason: string } */}
      </Match>
    </Switch>
  );
}
```

## 케이스 2: 동일한 필드를 가진 유니온 타입 (K = "status")

```tsx
type ApiResponse =
  | { status: "fetching", message: string }
  | { status: "success", message: string }
  | { status: "failed", message: string };

function ApiNotification({ response }: { response: ApiResponse }) {
  // K는 자동으로 "status"로 추론됨 (message는 string 타입이므로 제외)
  const { Switch, Match } = createSwitchMatch(response);
  
  return (
    <Switch when="status" fallback={<div>알 수 없는 상태</div>}>
      <Match case="fetching">
        {(props) => (
          <div className="loading">
            <Spinner />
            <span>{props.message}</span>
          </div>
        )}
      </Match>
      
      <Match case="success">
        {(props) => <Toast variant="success">{props.message}</Toast>}
      </Match>
      
      <Match case="failed">
        {(props) => <Toast variant="error">{props.message}</Toast>}
      </Match>
    </Switch>
  );
}
```

## 케이스 3: 여러 리터럴 필드를 가진 유니온 타입 (K = "status" | "message")

```tsx
type ApiResponse =
  | { status: "fetching", message: "C" }
  | { status: "success", message: "B" }
  | { status: "failed", message: "C" };

function ApiNotification({ response }: { response: ApiResponse }) {
  // K는 "status" | "message"로 추론됨
  // 따라서 명시적으로 지정해주어야 함
  const { Switch, Match } = createSwitchMatch<ApiResponse, "status">(response);
  
  return (
    <Switch when="status" fallback={<div>알 수 없는 상태</div>}>
      <Match case="fetching">
        {(props) => (
          <div className="loading">
            <Spinner />
            <span>{props.message}</span>
          </div>
        )}
      </Match>
      
      <Match case="success">
        {(props) => <Toast variant="success">{props.message}</Toast>}
      </Match>
      
      <Match case="failed">
        {(props) => <Toast variant="error">{props.message}</Toast>}
      </Match>
    </Switch>
  );
}
```

&nbsp;

# Mount

Next.js 프로젝트에서는 DOM이 마운트된 이후에만 특정 코드를 실행하거나 UI를 렌더링해야 하는 경우가 있습니다. 이를 위해 보통 useEffect와 useState를 사용하여 컴포넌트가 마운트되었는지 확인합니다. 그러나 이 패턴을 여러 컴포넌트에서 반복적으로 구현하면 코드의 가독성과 유지보수성이 저하될 수 있습니다. Mount 컴포넌트는 이러한 과정을 추상화하여, 간결하고 재사용 가능한 방식으로 관리할 수 있도록 돕습니다.

```tsx
function Mount({
  fallback?: ReactNode;
  children: ReactNode | (() => ReactNode | Promise<ReactNode>);
}): ReactNode;
```

Mount 컴포넌트는 ReactNode를 리턴하는 비동기 함수를 children으로 받을 수 있습니다. 이 경우, 비동기 함수가 반환하는 ReactNode가 렌더링되기 전까지는 fallback으로 전달된 컴포넌트를 화면에 표시합니다. 이는 데이터 로딩이나 비동기 작업이 필요한 UI를 처리할 때 유용하며, 비동기 작업이 완료된 후에만 UI가 렌더링되도록 제어할 수 있습니다. 아래는 useState와 useEffect를 사용하여 마운트 상태와 비동기 작업 결과를 관리하는 코드와, 동일한 로직을 Mount 컴포넌트로 다시 작성한 것입니다.

```tsx
export default function Comp() {
  const [content, setContent] = useState("Loading...");
   
  useEffect(() => {
    const loadContent = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setContent("Loaded!");
    };
    loadContent();
  }, []);
   
  return <div>{content}</div>;
}
```

```tsx
export default function Comp() {
  return (
    <Mount fallback={<div>Loading...</div>}>
      {async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      
        return <div>Loaded!</div>
      }}
    </Mount>
  )
}
```

앞서 언급된 다른 유틸리티 컴포넌트들과 달리 Mount 컴포넌트는 내부적으로 state를 사용하기에 Next.js의 app router에서는 클라이언트 컴포넌트로 취급됩니다.
