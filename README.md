[![Build Size](https://img.shields.io/bundlephobia/minzip/utilinent?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=utilinent)
[![Version](https://img.shields.io/npm/v/utilinent?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/utilinent)
[![Downloads](https://img.shields.io/npm/dt/utilinent.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/utilinent)

# Utilinent

**React를 위한 타입 안전하고 선언적인 Control Flow 라이브러리**

React에서 조건부 렌더링과 반복 렌더링은 필수적이지만, 복잡해질수록 코드가 읽기 어려워지고 타입 안전성을 보장하기 어려워집니다. Utilinent는 SolidJS의 우아한 Control Flow API에서 영감을 받아, React 개발자들에게 더 나은 개발 경험을 제공합니다.

## ✨ 주요 특징

- **🎯 타입 안전성**: TypeScript와 완벽하게 통합되어 컴파일 타임에 오류를 잡아냅니다
- **📖 가독성**: 복잡한 조건문을 선언적인 컴포넌트로 변환하여 코드를 이해하기 쉽게 만듭니다
- **🔄 일관성**: 팀 전체가 동일한 패턴을 사용하여 코드 스타일을 통일합니다
- **🚀 성능**: 불필요한 리렌더링을 방지하고 최적화된 렌더링을 제공합니다
- **📦 경량**: 최소한의 번들 크기로 프로젝트에 부담을 주지 않습니다

## 🚀 설치 및 사용법

```bash
npm install utilinent
```

```typescript
import { Show, For, createSwitcher, OptionalWrapper, Mount, Repeat, IntersectionObserver } from "utilinent"
```

## 📋 목차

- [Show - 조건부 렌더링](#show---조건부-렌더링)
- [For - 배열 렌더링](#for---배열-렌더링)  
- [createSwitcher - 타입 안전한 분기 처리](#createswitcher---타입-안전한-분기-처리)
- [OptionalWrapper - 조건부 래퍼](#optionalwrapper---조건부-래퍼)
- [Mount - 클라이언트 사이드 렌더링](#mount---클라이언트-사이드-렌더링)
- [Repeat - 횟수 기반 반복 렌더링](#repeat---횟수-기반-반복-렌더링)
- [IntersectionObserver - 뷰포트 감지](#intersectionobserver---뷰포트-감지)

---

# Show - 조건부 렌더링

**기존 방식의 문제점**

React에서 조건부 렌더링을 할 때 삼항 연산자(`? :`), AND 연산자(`&&`), OR 연산자(`||`) 등을 혼용하면 코드 스타일이 일관되지 않습니다. 특히 중첩된 조건이나 복잡한 로직에서는 가독성이 크게 떨어집니다.

```tsx
// ❌ 일관성 없는 기존 방식
{isLoading && <Spinner />}
{user ? <UserProfile user={user} /> : <LoginButton />}
{data || <EmptyState />}
```

**Show 컴포넌트의 해결책**

`Show` 컴포넌트는 모든 조건부 렌더링을 일관된 방식으로 처리하며, TypeScript의 타입 가드 기능을 활용해 안전한 타입 추론을 제공합니다.

```tsx
interface ShowProps<T> {
  when: T;                                           // 조건값 (truthy/falsy 체크)
  fallback?: ReactNode;                             // 조건이 false일 때 렌더링할 내용
  children: ReactNode | ((item: NonNullable<T>) => ReactNode); // 조건이 true일 때의 내용
}
```

**✅ Show를 사용한 개선된 방식**

```tsx
// 간단한 조건부 렌더링
<Show when={isLoading}>
  <Spinner />
</Show>

// fallback과 함께
<Show when={user} fallback={<LoginButton />}>
  {(user) => <UserProfile user={user} />}  {/* user는 자동으로 NonNullable 타입으로 추론 */}
</Show>

// 기본값 표시
<Show when={data} fallback={<EmptyState />}>
  {(data) => <DataView data={data} />}
</Show>
```

**🎯 타입 안전성의 장점**

```tsx
interface User {
  id: number;
  name: string;
}

const user: User | null = getUser();

<Show when={user}>
  {(user) => (
    <div>
      {/* TypeScript가 user가 User 타입임을 보장 */}
      <h1>{user.name}</h1>      {/* ✅ 안전함 */}
      <p>ID: {user.id}</p>      {/* ✅ 안전함 */}
    </div>
  )}
</Show>
```

---

# For - 배열 렌더링

**기존 방식의 문제점**

React에서 배열을 렌더링할 때 `Array.map()`을 사용하는 것은 일반적이지만, 빈 배열이나 `null`/`undefined` 처리를 위해 추가적인 조건문이 필요하여 코드가 복잡해집니다.

```tsx
// ❌ 복잡한 기존 방식
{users && users.length > 0 
  ? users.map(user => <UserCard key={user.id} user={user} />)
  : <EmptyUserList />
}
```

**For 컴포넌트의 해결책**


`For` 컴포넌트는 배열 렌더링과 예외 상황 처리를 하나의 컴포넌트에서 깔끔하게 해결합니다.

```tsx
interface ForProps<T extends Array<unknown>> {
  each: T | null | undefined;                       // 렌더링할 배열
  fallback?: ReactNode;                             // 배열이 비어있거나 null일 때의 대체 내용
  children: (item: T[number], index: number) => ReactNode; // 각 아이템을 렌더링하는 함수
}
```

**✅ For를 사용한 개선된 방식**

```tsx
// 기본 배열 렌더링
<For each={users} fallback={<EmptyUserList />}>
  {(user, index) => (
    <UserCard key={user.id} user={user} index={index} />
  )}
</For>

// API 데이터와 함께 (null/undefined 안전 처리)
const { data: userList } = useQuery({ ... }); // userList는 User[] | undefined

<For each={userList} fallback={<LoadingSpinner />}>
  {(user) => (
    <div key={user.id}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  )}
</For>
```

**🎯 타입 안전성의 장점**

```tsx
interface Product {
  id: string;
  name: string;
  price: number;
}

const products: Product[] | null = getProducts();

<For each={products} fallback={<div>상품이 없습니다</div>}>
  {(product, index) => (
    <div key={product.id}>
      {/* TypeScript가 product가 Product 타입임을 보장 */}
      <h4>{product.name}</h4>        {/* ✅ 자동완성 지원 */}
      <span>${product.price}</span>   {/* ✅ 타입 체크 */}
    </div>
  )}
</For>
```

---

# createSwitcher - 타입 안전한 분기 처리

**기존 방식의 문제점**
복잡한 유니온 타입에서 특정 필드 값에 따라 다른 컴포넌트를 렌더링할 때, 기존의 `switch`문이나 연속된 `if`문은 코드 복잡성과 실수 가능성 문제를 야기합니다.

```tsx
type ApiResponse =
  | { status: "loading" }
  | { status: "success", data: User[], count: number }
  | { status: "error", message: string, code: number };

// ❌ 복잡하고 실수하기 쉬운 기존 방식
function renderApiResponse(response: ApiResponse) {
  switch (response.status) {
    case 'loading':
      return <Spinner />;
    case 'success':
      // 복잡한 JSX가 switch 문 안에 섞여있음
      return (
        <div>
          <h2>성공! ({response.count}개 항목)</h2>
          {response.data.map(user => <UserCard key={user.id} user={user} />)}
        </div>
      );
    case 'error':
      // 또 다른 복잡한 JSX
      return (
        <div className="error">
          <h3>오류 발생 (코드: {response.code})</h3>
          <p>{response.message}</p>
          <button onClick={retry}>다시 시도</button>
        </div>
      );
    default:
      return null; // ❌ fallback 처리를 까먹기 쉬움
  }
}
```

**createSwitcher의 해결책**
`createSwitcher`는 데이터 객체의 구조를 분석하여 타입 안전한 Switch/Match 컴포넌트를 생성합니다. 각 case에서 정확한 타입 추론을 제공하여 런타임 오류를 컴파일 타임에 방지합니다.

```tsx
function createSwitcher<T, K extends LiteralKeys<T>>(data: T): {
  Switch: ({ 
    when: K,                                        // 분기할 필드명
    children: Array<ReactElement>,                  // Match 컴포넌트들
    fallback?: ReactNode                           // 매칭되는 case가 없을 때의 대체 내용
  }) => ReactNode;
  
  Match: <V extends ExtractValues<T, K>>({
    case: V,                                       // 매칭할 값
    children: (props: ExtractByKeyValue<T, K, V>) => ReactNode // 해당 case의 정확한 타입 제공
  }) => ReactNode;
}
```

**🧠 작동 원리**
- `createSwitcher`는 유니온 타입 `T`에서 리터럴 값을 가진 키들을 `K`로 추출합니다
- 리터럴 키가 하나만 있으면 자동 추론, 여러 개면 명시적 타입 지정이 필요합니다
- 각 `Match` 컴포넌트는 해당 case에 정확히 매칭되는 타입을 children 함수에 제공합니다

## 🔍 사용 사례들

### 케이스 1: 서로 다른 필드를 가진 유니온 타입

```tsx
type ApiResponse =
  | { status: "loading" }
  | { status: "success", data: User[] }
  | { status: "error", message: string };

function ApiStatus({ response }: { response: ApiResponse }) {
  const { Switch, Match } = createSwitcher(response); // K는 자동으로 "status"로 추론
  
  return (
    <Switch when="status" fallback={<div>알 수 없는 상태</div>}>
      <Match case="loading">
        {(props) => <Spinner />} 
        {/* props: { status: "loading" } */}
      </Match>
      
      <Match case="success">
        {(props) => <UserList users={props.data} />}
        {/* props: { status: "success", data: User[] } - data 필드 사용 가능! */}
      </Match>
      
      <Match case="error">
        {(props) => <ErrorAlert message={props.message} />}
        {/* props: { status: "error", message: string } - message 필드 사용 가능! */}
      </Match>
    </Switch>
  );
}
```

### 케이스 2: 동일한 필드를 가진 유니온 타입

```tsx
type NotificationState =
  | { status: "pending", message: string }
  | { status: "sent", message: string }
  | { status: "failed", message: string };

function NotificationStatus({ notification }: { notification: NotificationState }) {
  const { Switch, Match } = createSwitcher(notification); // K는 자동으로 "status"로 추론
  
  return (
    <Switch when="status">
      <Match case="pending">
        {(props) => (
          <div className="notification-pending">
            <ClockIcon />
            <span>{props.message}</span>
          </div>
        )}
      </Match>
      
      <Match case="sent">
        {(props) => (
          <div className="notification-success">
            <CheckIcon />
            <span>{props.message}</span>
          </div>
        )}
      </Match>
      
      <Match case="failed">
        {(props) => (
          <div className="notification-error">
            <XIcon />
            <span>{props.message}</span>
          </div>
        )}
      </Match>
    </Switch>
  );
}
```

### 케이스 3: 여러 리터럴 필드가 있는 경우 (명시적 타입 지정 필요)

```tsx
type ComplexState =
  | { status: "loading", priority: "high" }
  | { status: "success", priority: "low" }
  | { status: "error", priority: "medium" };

function ComplexStatus({ state }: { state: ComplexState }) {
  // status와 priority 모두 리터럴 타입이므로 명시적으로 지정
  const { Switch, Match } = createSwitcher<ComplexState, "status">(state);
  
  return (
    <Switch when="status" fallback={<div>알 수 없는 상태</div>}>
      <Match case="loading">
        {(props) => (
          <div className={`loading priority-${props.priority}`}>
            <Spinner />
            <span>로딩 중... (우선순위: {props.priority})</span>
          </div>
        )}
      </Match>
      
      <Match case="success">
        {(props) => (
          <div className={`success priority-${props.priority}`}>
            <CheckIcon />
            <span>완료! (우선순위: {props.priority})</span>
          </div>
        )}
      </Match>
      
      <Match case="error">
        {(props) => (
          <div className={`error priority-${props.priority}`}>
            <ErrorIcon />
            <span>오류 발생 (우선순위: {props.priority})</span>
          </div>
        )}
      </Match>
    </Switch>
  );
}
```

---

# OptionalWrapper - 조건부 래퍼

**기존 방식의 문제점**
특정 조건에 따라 요소를 다른 컴포넌트로 감싸야 할 때, 기존 방식은 중복 코드를 유발하거나 가독성을 해칩니다.

```tsx
// ❌ 중복 코드가 발생하는 기존 방식
{isClickable ? (
  <button onClick={handleClick}>
    <img src={image} alt="thumbnail" />
  </button>
) : (
  <img src={image} alt="thumbnail" />  // 중복!
)}
```

**OptionalWrapper의 해결책**
`OptionalWrapper`는 조건에 따라 래퍼를 적용하거나 생략하는 패턴을 간단하고 재사용 가능하게 만듭니다.

```tsx
interface OptionalWrapperProps {
  when: boolean;                                    // 래퍼를 적용할 조건
  children: ReactNode;                              // 감싸질 내용
  wrapper: (children: ReactNode) => ReactNode;      // 조건이 true일 때 적용할 래퍼 함수
}
```

**✅ OptionalWrapper를 사용한 개선된 방식**
```tsx
// 조건부 링크 래핑
<OptionalWrapper
  when={hasUrl}
  wrapper={(children) => <a href={url} target="_blank">{children}</a>}
>
  <img src={image} alt="thumbnail" />
</OptionalWrapper>

// 조건부 버튼 래핑
<OptionalWrapper
  when={isClickable}
  wrapper={(children) => (
    <button onClick={handleClick} className="clickable-wrapper">
      {children}
    </button>
  )}
>
  <ProductCard product={product} />
</OptionalWrapper>

// 조건부 스타일 컨테이너
<OptionalWrapper
  when={isHighlighted}
  wrapper={(children) => (
    <div className="highlight-border p-4 bg-yellow-100">
      {children}
    </div>
  )}
>
  <ContentBlock content={content} />
</OptionalWrapper>
```

**🎯 실제 사용 사례**
```tsx
function MediaCard({ media, isInteractive }: { media: Media, isInteractive: boolean }) {
  return (
    <OptionalWrapper
      when={isInteractive}
      wrapper={(children) => (
        <button
          className="media-button"
          onClick={() => openModal(media)}
          aria-label={`${media.title} 상세보기`}
        >
          {children}
        </button>
      )}
    >
      <div className="media-content">
        <img src={media.thumbnail} alt={media.title} />
        <h3>{media.title}</h3>
        <p>{media.description}</p>
      </div>
    </OptionalWrapper>
  );
}
```

---

# Mount - 클라이언트 사이드 렌더링

**기존 방식의 문제점**
Next.js나 SSR 환경에서 DOM이 마운트된 후에만 실행되어야 하는 코드를 처리할 때, `useEffect`와 `useState`를 반복적으로 사용하게 되어 보일러플레이트 코드가 많아집니다.

```tsx
// ❌ 반복되는 보일러플레이트 코드
function ClientOnlyComponent() {
  const [isMounted, setIsMounted] = useState(false);
  const [content, setContent] = useState<ReactNode>("Loading...");
  
  useEffect(() => {
    setIsMounted(true);
    const loadContent = async () => {
      await someAsyncOperation();
      setContent(<ActualContent />);
    };
    loadContent();
  }, []);
  
  if (!isMounted) {
    return <div>Loading...</div>;
  }
  
  return <>{content}</>;
}
```

**Mount 컴포넌트의 해결책**
`Mount` 컴포넌트는 클라이언트 사이드 렌더링과 비동기 작업을 간단하고 선언적으로 처리할 수 있게 해줍니다.

```tsx
interface MountProps {
  fallback?: ReactNode;                             // 마운트 전 또는 로딩 중 표시할 내용
  children: ReactNode | (() => ReactNode | Promise<ReactNode>); // 마운트 후 렌더링할 내용
}
```

**✅ Mount를 사용한 개선된 방식**

**기본 클라이언트 사이드 렌더링**
```tsx
// 간단한 클라이언트 전용 컴포넌트
<Mount fallback={<div>Loading...</div>}>
  <ClientOnlyWidget />
</Mount>

// 브라우저 전용 API 사용
<Mount fallback={<div>Initializing...</div>}>
  <GeolocationComponent />
</Mount>
```

**비동기 작업과 함께**
```tsx
// 기존 방식 (복잡함)
function OldWay() {
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

// ✅ Mount 사용 (간단함)
function NewWay() {
  return (
    <Mount fallback={<div>Loading...</div>}>
      {async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return <div>Loaded!</div>;
      }}
    </Mount>
  );
}
```

**🎯 실제 사용 사례**
```tsx
// 차트 라이브러리 (클라이언트 전용)
<Mount fallback={<ChartSkeleton />}>
  {async () => {
    const chartData = await fetchChartData();
    return <Chart data={chartData} />;
  }}
</Mount>

// 지도 컴포넌트
<Mount fallback={<MapPlaceholder />}>
  <MapComponent coordinates={coordinates} />
</Mount>

// 테마 의존적 컴포넌트
<Mount fallback={<div>테마 로딩 중...</div>}>
  {() => {
    const theme = getClientTheme();
    return <ThemedComponent theme={theme} />;
  }}
</Mount>
```

---

# Repeat - 횟수 기반 반복 렌더링

**기존 방식의 문제점**

특정 횟수만큼 컴포넌트를 반복 렌더링할 때, 기존 방식은 불필요한 배열을 생성하거나 복잡한 로직을 작성해야 합니다.

```tsx
// ❌ 불필요한 배열 생성
{Array(5).fill(null).map((_, index) => (
  <SkeletonCard key={index} />
))}

// ❌ 복잡한 반복 로직
{(() => {
  const items = [];
  for (let i = 0; i < starCount; i++) {
    items.push(<Star key={i} filled={i < rating} />);
  }
  return items;
})()}
```

**Repeat 컴포넌트의 해결책**

`Repeat` 컴포넌트는 횟수 기반 반복 렌더링을 간단하고 직관적으로 처리할 수 있게 해줍니다.

```tsx
interface RepeatProps {
  times: number;                                    // 반복 횟수
  fallback?: ReactNode;                             // times가 0 이하일 때의 대체 내용
  children: (index: number) => ReactNode;           // 각 반복에서 렌더링할 함수
}
```

**✅ Repeat을 사용한 개선된 방식**

**기본 반복 렌더링**
```tsx
// 스켈레톤 UI 생성
<Repeat times={5} fallback={<div>로딩할 항목이 없습니다</div>}>
  {(index) => <SkeletonCard key={index} delay={index * 200} />}
</Repeat>

// 평점 시스템
<Repeat times={5}>
  {(index) => (
    <Star 
      key={index}
      filled={index < rating}
      onClick={() => setRating(index + 1)}
    />
  )}
</Repeat>

// 페이지네이션 번호
<Repeat times={totalPages}>
  {(index) => {
    const pageNumber = index + 1;
    return (
      <PageButton 
        key={pageNumber}
        page={pageNumber}
        active={currentPage === pageNumber}
        onClick={() => setCurrentPage(pageNumber)}
      />
    );
  }}
</Repeat>
```

**🎯 실제 사용 사례**

```tsx
// 로딩 스켈레톤
function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Repeat times={9}>
        {(index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
            <div className="bg-gray-300 h-4 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 rounded w-2/3"></div>
          </div>
        )}
      </Repeat>
    </div>
  );
}

// 진행률 표시기
function ProgressDots({ total, current }: { total: number, current: number }) {
  return (
    <div className="flex space-x-2">
      <Repeat times={total}>
        {(index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${
              index < current ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        )}
      </Repeat>
    </div>
  );
}

// 메뉴 아이템 생성
function NavigationMenu({ menuCount }: { menuCount: number }) {
  return (
    <nav className="flex space-x-4">
      <Repeat times={menuCount} fallback={<div>메뉴가 없습니다</div>}>
        {(index) => {
          const menuItem = menuItems[index];
          return (
            <a 
              key={index}
              href={menuItem?.href}
              className="px-4 py-2 text-gray-700 hover:text-blue-600"
            >
              {menuItem?.label || `메뉴 ${index + 1}`}
            </a>
          );
        }}
      </Repeat>
    </nav>
  );
}
```

**🔧 유용한 패턴들**

```tsx
// 조건부 반복 (0일 때 fallback 표시)
<Repeat times={itemCount} fallback={<EmptyState />}>
  {(index) => <Item key={index} data={items[index]} />}
</Repeat>

// 지연 애니메이션
<Repeat times={6}>
  {(index) => (
    <div 
      key={index}
      className="fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Card />
    </div>
  )}
</Repeat>

// 인덱스 기반 스타일링
<Repeat times={4}>
  {(index) => (
    <div 
      key={index}
      className={`col-span-${index % 2 === 0 ? '2' : '1'}`}
    >
      <GridItem />
    </div>
  )}
</Repeat>
```
---

# IntersectionObserver - 뷰포트 감지

**기존 방식의 문제점**
뷰포트에 요소가 들어오거나 나가는 것을 감지하기 위해 직접 `IntersectionObserver` API를 사용하면 보일러플레이트 코드가 많아지고, cleanup 처리를 놓치기 쉽습니다.

```tsx
// ❌ 복잡한 기존 방식
function LazyImage({ src, alt }: { src: string, alt: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [hasLoaded]);

  return (
    <div ref={ref}>
      {isVisible ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="w-full h-64 bg-gray-200" />
      )}
    </div>
  );
}
```

**IntersectionObserver 컴포넌트의 해결책**

`IntersectionObserver` 컴포넌트는 뷰포트 감지 로직을 간단하고 재사용 가능하게 만들어 다양한 최적화 패턴을 쉽게 구현할 수 있게 해줍니다.

```tsx
interface IntersectionObserverProps {
  children: ReactNode | ((isIntersecting: boolean, entry?: IntersectionObserverEntry) => ReactNode);
  threshold?: number | number[];                    // 교차 임계값 (0.0 ~ 1.0)
  rootMargin?: string;                              // 루트 마진
  triggerOnce?: boolean;                           // 한 번만 트리거할지 여부
  disabled?: boolean;                              // 관찰 비활성화
  fallback?: ReactNode;                            // disabled일 때 표시할 내용
  onIntersect?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void; // 교차 이벤트 콜백
}
```

**✅ IntersectionObserver를 사용한 개선된 방식**

**지연 로딩 (Lazy Loading)**

두 가지 방식으로 지연 로딩을 구현할 수 있습니다:

```tsx
// 방식 1: fallback prop 사용 (비활성화/에러 상황 처리)
<IntersectionObserver 
  threshold={0.1} 
  triggerOnce={true}
  disabled={!shouldLoad}
  fallback={<ImagePlaceholder />}  // disabled일 때 표시
>
  {(isIntersecting) => 
    isIntersecting ? (
      <img src={imageUrl} alt="지연 로딩 이미지" loading="lazy" />
    ) : (
      <div className="w-full h-64 bg-gray-200 animate-pulse" />  // 아직 안 보일 때
    )
  }
</IntersectionObserver>

// 방식 2: fallback을 활용한 지연 로딩
<IntersectionObserver 
  threshold={0.2} 
  triggerOnce={true}
  fallback={<ComponentSkeleton />}
>
  {(isIntersecting) => 
    isIntersecting && <HeavyComponent data={data} />
  }
</IntersectionObserver>
```

> **💡 fallback vs 조건부 렌더링**
> - **fallback**: 컴포넌트 비활성화나 브라우저 미지원 시의 대체 UI
> - **조건부 렌더링**: 실제 뷰포트 교차 상태에 따른 동적 UI

**무한 스크롤**
```tsx
// 무한 스크롤 트리거
<IntersectionObserver
  threshold={1.0}
  rootMargin="0px 0px 200px 0px"  // 하단 200px 전에 트리거
  onIntersect={(isIntersecting) => {
    if (isIntersecting && hasNextPage && !isLoading) {
      loadMoreItems();
    }
  }}
>
  <div className="h-20 flex items-center justify-center">
    {isLoading ? <Spinner /> : "더 보기"}
  </div>
</IntersectionObserver>

// 페이지네이션과 함께
<For each={items}>
  {(item) => <ItemCard key={item.id} item={item} />}
</For>

<Show when={hasNextPage}>
  <IntersectionObserver
    threshold={0.5}
    onIntersect={(isIntersecting) => {
      if (isIntersecting) loadNextPage();
    }}
  >
    <LoadMoreButton />
  </IntersectionObserver>
</Show>
```

**애니메이션 트리거**
```tsx
// 뷰포트 진입 시 애니메이션
<IntersectionObserver threshold={0.3} triggerOnce={true}>
  {(isIntersecting) => (
    <div className={`transition-all duration-1000 ${
      isIntersecting 
        ? 'opacity-100 translate-y-0' 
        : 'opacity-0 translate-y-10'
    }`}>
      <FeatureCard />
    </div>
  )}
</IntersectionObserver>

// 순차적 애니메이션
<Repeat times={features.length}>
  {(index) => (
    <IntersectionObserver 
      key={index}
      threshold={0.5} 
      triggerOnce={true}
    >
      {(isIntersecting) => (
        <div 
          className={`transition-all duration-700 ${
            isIntersecting ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{ 
            transitionDelay: isIntersecting ? `${index * 100}ms` : '0ms' 
          }}
        >
          <FeatureItem feature={features[index]} />
        </div>
      )}
    </IntersectionObserver>
  )}
</Repeat>
```

**🎯 실제 사용 사례**

```tsx
// 갤러리 이미지 지연 로딩
function ImageGallery({ images }: { images: ImageData[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <For each={images}>
        {(image) => (
          <IntersectionObserver 
            key={image.id}
            threshold={0.1}
            triggerOnce={true}
          >
            {(isIntersecting) => (
              <div className="aspect-square overflow-hidden rounded-lg">
                {isIntersecting ? (
                  <img 
                    src={image.url} 
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 animate-pulse" />
                )}
              </div>
            )}
          </IntersectionObserver>
        )}
      </For>
    </div>
  );
}

// 뷰포트 진입 분석
function AnalyticsSection({ sectionId, children }: { 
  sectionId: string, 
  children: ReactNode 
}) {
  return (
    <IntersectionObserver
      threshold={0.5}
      triggerOnce={true}
      onIntersect={(isIntersecting, entry) => {
        if (isIntersecting) {
          analytics.track('section_viewed', {
            sectionId,
            visibilityRatio: entry?.intersectionRatio,
            viewportHeight: window.innerHeight
          });
        }
      }}
    >
      {children}
    </IntersectionObserver>
  );
}

// 진행률 표시기
function ScrollProgressIndicator() {
  return (
    <IntersectionObserver
      threshold={Array.from({length: 101}, (_, i) => i / 100)} // 0.00 ~ 1.00
      rootMargin="-50% 0px -50% 0px"
    >
      {(isIntersecting, entry) => (
        <div className="fixed top-0 left-0 w-full h-2 bg-gray-200 z-50">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ 
              width: `${(entry?.intersectionRatio || 0) * 100}%` 
            }}
          />
        </div>
      )}
    </IntersectionObserver>
  );
}

// 조건부 로딩
function ConditionalContent({ shouldLoad, children }: {
  shouldLoad: boolean,
  children: ReactNode
}) {
  return (
    <IntersectionObserver 
      disabled={!shouldLoad}
      threshold={0.1}
      fallback={<div>로딩이 비활성화되었습니다</div>}
    >
      {(isIntersecting) => 
        isIntersecting ? children : <ContentPlaceholder />
      }
    </IntersectionObserver>
  );
}
```

**🔧 고급 패턴들**

```tsx
// 다중 임계값 관찰
<IntersectionObserver threshold={[0, 0.25, 0.5, 0.75, 1.0]}>
  {(isIntersecting, entry) => (
    <div 
      className="transition-opacity duration-300"
      style={{ 
        opacity: entry?.intersectionRatio || 0 
      }}
    >
      <GradualContent />
    </div>
  )}
</IntersectionObserver>

// 루트 마진을 활용한 프리로딩
<IntersectionObserver
  threshold={0}
  rootMargin="0px 0px 500px 0px"  // 500px 전에 미리 로딩
  triggerOnce={true}
  onIntersect={(isIntersecting) => {
    if (isIntersecting) {
      preloadNextPageData();
    }
  }}
>
  <div>다음 페이지 프리로드 트리거</div>
</IntersectionObserver>

// 뷰포트 벗어남 감지
<IntersectionObserver
  threshold={0}
  onIntersect={(isIntersecting) => {
    if (!isIntersecting) {
      pauseVideo();
    } else {
      playVideo();
    }
  }}
>
  <VideoPlayer src={videoUrl} />
</IntersectionObserver>
```

> **⚠️ 브라우저 호환성**: `IntersectionObserver`는 현대 브라우저에서 잘 지원되지만, 구형 브라우저에서는 폴리필이 필요할 수 있습니다. 컴포넌트는 API가 지원되지 않는 환경에서 graceful fallback을 제공합니다.
