# utilinent 측정

[English](./README.md) | 한국어

현재 소스를 측정하는 독립 개발 도구입니다. 이전 구현과 비교하거나 브라우저 회귀
테스트를 가져오지 않습니다. `bench/`는 npm 패키지에 포함되지 않으며 런타임 소스에
계측 코드를 추가하지 않습니다.

## 재현

워크스페이스가 지원하는 Node 버전과 루트 manifest의 pnpm 버전으로 저장소 루트에서
실행합니다.

```sh
pnpm install --frozen-lockfile
pnpm --filter @ilokesto/utilinent exec playwright install chromium
pnpm --filter @ilokesto/utilinent bench --warmup 3 --samples 5 --targets 100 --iterations 20 --output /tmp/utilinent-run-1.json
pnpm --filter @ilokesto/utilinent bench --warmup 3 --samples 5 --targets 100 --iterations 20 --output /tmp/utilinent-run-2.json
```

Linux에서는 `playwright install --with-deps chromium`이 필요할 수 있습니다. 각
실행은 새로운 headless Chromium 프로세스와 context를 만들고, 패키지의 Vite로
production React 번들을 메모리에 빌드하여 OS가 배정한 loopback 포트로 제공합니다.
JSON 출력 전에 브라우저와 서버를 종료합니다. 영구 프로필이나 빌드 디렉터리는
만들지 않습니다. 브라우저 설치 캐시는 Playwright가 재사용하는 정상 캐시입니다.

숫자 옵션은 안전한 정수여야 합니다. warmup은 0 이상, 나머지는 1 이상입니다.
기본값은 위 명령과 같습니다. warmup 1회는 lazy/observer/mount 전체 작업이며
결과에서 제외합니다. 각 sample도 같은 세 작업을 수행합니다. `iterations`는 lazy
작업의 proxy 수이자 mount 작업의 새 React root 수입니다. `targets`는 root별 관찰
대상 수이자 proxy별 캐시 접근 횟수입니다. GC는 시간 측정 루프가 끝난 후 수행합니다.
`--output` 파일에는 pnpm 배너 없는 JSON이 저장되고 stdout에도 JSON을 출력합니다.
stdout에 JSON만 필요하면 패키지 디렉터리에서 `node bench/run.mjs`를 실행합니다.

## 측정 범위

| 작업 | 관찰값 | 결정적 불변식 |
| --- | --- | --- |
| Lazy tag | proxy 생성, 첫 접근, 캐시 접근 시간(ms), 실제 factory 반환 wrapper 수 | 접근 전 wrapper 0개, proxy별 div wrapper 1개, 반복 접근 identity 유지, proxy끼리는 다른 wrapper |
| 공유 observer | 구독/해제 시간, native callback 대기, 생성/observe/unobserve/disconnect 횟수 | 정규화 옵션이 같으면 native observer 1개 공유, 마지막 소유자 해제 때만 disconnect, 모든 대상이 실제 native entry 수신 |
| React mount/unmount | 실제 DOM에 production createRoot/Show.div/useIntersectionObserver 실행, 시간과 대상 수명 처리량 | 모든 대상 mount/구독/unmount/해제, root 수명당 observer 1개, pool 0으로 복귀 |
| 정리 후 보유 | 강제 GC 후 대상, callback payload, 명시적 root, native observer, 양성 대조군 WeakRef 생존 수 | 알려진 강한 참조는 검출해야 함. 해제 객체의 수집 여부는 시간 의존 assertion이 아닌 관찰값 |

Lazy 측정은 기존 내부 `createProxy`와 `createTagRenderer`에 호출 수를 세는
factory를 전달하여 실제 React wrapper를 만듭니다. `Show.div` identity도 확인합니다.
전체 JavaScript 할당 수, 모든 export의 import 시점 할당, byte 측정은 아닙니다.

원래 native `IntersectionObserver`를 상속하여 생성과 메서드 호출을 세고 구독 완료를
알립니다. 모든 호출과 callback은 실제 Chromium 동작을 그대로 수행합니다. 가짜
observer가 아닙니다. 계측 코드는 숫자와 선택적 WeakRef만 보관하며 observer/대상
강한 참조 목록을 만들지 않습니다. 횟수는 native API 호출 수이며 브라우저 내부
heap 객체 수가 아닙니다. pool 통계는 별도의 내부 소유권 검사입니다.

Observer 작업은 같은 viewport root와 `"0px"` margin에서 `[0.5, 0]`과
`[0, 0.5, 0.5]`를 번갈아 사용합니다. 실제 callback 신호로 완료를 확인하며 30초는
실패 timeout이지 sleep이 아닙니다. callback 대기는 별도 보고하며 순수 native 연산
시간으로 해석하지 않습니다. 마지막 해제 직전에는 구독 1개가 남아야 합니다.

React 작업은 StrictMode 없는 production React입니다. 매 반복에서 새 root와 대상
컴포넌트를 만들고 `flushSync`로 렌더링한 뒤 정확한 native `observe` 횟수를 기다립니다.
ref에 따른 React 갱신과 passive effect의 구독까지 포함합니다. 이후 동기 unmount를
수행합니다. intersection 전달이나 paint는 기다리지 않습니다. mount/unmount 시간에는
React와 계측 오버헤드가 포함되고 전체 시간에는 fixture 준비, assertion, 정리도
포함됩니다. 처리량은 **초당 대상 mount+unmount 수명 수**이며 프레임 수나 root
작업 수가 아닙니다. 별도의 비동기 `Mount` 컴포넌트를 측정하지 않습니다.

## 보유 측정 방법과 한계

시간 측정 후 별도 native observer 집합에 명시적 DOM root와 `targets`개 요소,
callback별 payload 객체를 만듭니다. payload는 대상도 참조합니다. WeakRef만 기록하고
native 전달 후 모든 구독을 해제하고 root를 제거합니다. 준비 함수가 반환되어 해제
closure와 지역 배열이 사라진 후 GC를 수행합니다. React 필드를 삭제하거나 DOM
내부를 수정하거나 라이브러리가 가진 참조를 직접 비우지 않습니다.

동시에 두 번째 detached 요소 집합은 payload 배열로 의도적으로 강하게 보관합니다.
driver가 Chromium CDP `HeapProfiler.collectGarbage`를 두 번 실행합니다. WeakRef
생성/deref와 다른 브라우저 task에서 수행합니다. `controlRetained`는 강한 참조가
남아 있을 때의 생존 수입니다. 대조군 배열만 해제하고 두 번 더 GC한 뒤
`controlReleased`를 기록합니다. 알려진 보유 참조를 검출하고 해제 후 변화를 관찰할
수 있는지 확인하는 것이며 대조군을 라이브러리 누수로 오해하면 안 됩니다.

해제 집합의 생존 수 0은 해당 실행에서 수집되었다는 뜻이며 모든 누수 부재의 증명은
아닙니다. 0이 아니어도 숨기거나 0이 될 때까지 재시도하거나 자동으로 누수로 판정하지
않습니다. 이 집합은 직접 pool의 대상/callback/root/observer 소유권을 분리합니다.
unmount 후 React fiber, 앱 closure, 모든 브라우저 내부 객체의 보유는 측정하지
않습니다. mount 소유권은 DOM 제거, native 호출, pool 구독 수로 별도 확인합니다.
캐시 wrapper는 proxy가 살아 있는 동안 의도적으로 proxy에 보관됩니다.

선택한 Chromium/CDP는 강제 GC를 지원합니다. 지원되지 않는 환경에서는 가짜 결과
대신 실행이 실패합니다. `heapBytes.value`는 `null`입니다. 신뢰할 수 있는 귀속 byte
기준선이 없고 전체 heap은 React/JIT/계측/DOM/native 관리 메모리가 섞이기 때문입니다.
최적화 전후 기준선, 절약 byte, 속도 향상을 주장하지 않습니다.

## JSON 계약과 검증

`schemaVersion: 1`의 내용:

- `environment`: 시각, Git 소스 revision, 패키지/Node/React/ReactDOM/Vite/
  Playwright/Chromium 버전, OS, 아키텍처, CPU, viewport, user agent.
- `config`: warmup, sample, target, iteration 수.
- `measurements.samples[]`: `lazy`, `observer`, `mount` 원시 결과. `Ms`는 밀리초입니다.
  이상값을 임의 제거하지 않습니다.
- `invariants`: 최종 pool/DOM 소유권, 원래 native observer 복원, 수명 검사, 대조군 검출.
- `retention`: GC 방식, checkpoint별 GC 횟수와 생존 수.
- `heapBytes`: 미측정 값과 이유. `limits`: 해석 한계.
- `resources`: 브라우저/서버 정상 종료, 메모리 빌드 여부.

불변식이나 브라우저 오류는 0이 아닌 종료 코드입니다. 시간, 처리량, 해제 집합 생존 수에
통과 기준선을 두지 않습니다. 일반 CI의 속도 gate가 아닌 명시적 측정 명령입니다.

기존 패키지 검사는 별도로 실행합니다.

```sh
pnpm --filter @ilokesto/utilinent test
pnpm --filter @ilokesto/utilinent typecheck
pnpm --filter @ilokesto/utilinent build
```

구현과 문서 작성에는 AI의 도움을 받았습니다. 함께 기록한 실제 실행 결과는 측정하지
않은 byte와 비교 수치와 구분합니다.

## 기록된 실행: 2026년 10월 21일

모든 sample 원시값: [실행 1](./results/2026-10-21-run-1.json),
[실행 2](./results/2026-10-21-run-2.json). 위 명령으로 각각 `05:04:50.254Z`,
`05:04:51.164Z`에 시작한 독립 CLI/브라우저 실행입니다. 패키지 검사 완료 후 순차
실행했으며 둘 다 종료 코드 0입니다. 각각 warmup 3회, sample 5회, 대상 100개,
iteration 20회로 mount sample당 대상 수명 2,000개입니다. CPU 격리나 통제된
백그라운드 부하 환경은 아닙니다.

환경: Apple M4 Pro, 논리 CPU 12개, arm64 Darwin 27.2.0, Node 24.20.0,
pnpm 10.17.1, utilinent 1.2.1, 소스 revision
`e688025ded18bc78eaeb757341c7622a3a15ff40`, React/ReactDOM 19.2.8, Vite 7.3.6,
Playwright 1.62.1, Chromium 151.0.7922.34, headless 1280 x 720입니다.
벤치마크 자체는 해당 소스 revision 위의 미커밋 추가 코드였습니다.

아래 값은 sample 5개의 중앙값이며 괄호는 전체 최솟값–최댓값입니다.

| 관찰값 | 실행 1 | 실행 2 |
| --- | --- | --- |
| 대상 2,000개 mount 시간 | 6.3 ms (5.5–6.4) | 6.1 ms (5.3–6.3) |
| 대상 2,000개 unmount 시간 | 1.0 ms (0.9–1.7) | 1.4 ms (0.9–1.6) |
| mount/unmount 전체 batch 시간 | 7.3 ms (6.9–7.5) | 7.3 ms (6.9–7.7) |
| 초당 대상 수명 수 | 273,973 (266,667–289,855) | 273,973 (259,740–289,855) |
| Native entry 전달 대기 | 6.6 ms (2.8–15.1) | 9.0 ms (8.9–10.6) |

Lazy 생성/첫 접근/캐시 접근 및 observer 구독/해제 batch 시간은 관찰된
타이머 해상도 부근입니다. 0은 작업이나 비용이 없다는 뜻이 아니며 이 작은 batch로
의미 있는 속도 차이를 구분할 수 없습니다. 추가 조사에는 횟수를 늘릴 수 있지만 유리한
비교 수치를 만들기 위한 조정은 아닙니다. Native 전달 대기는 스케줄링을 포함합니다.

총 sample 10개 모두 tag 접근 전 wrapper 0개, 첫 접근 후 20개, 캐시 접근 2,000회
후에도 20개이며 identity가 유지되었습니다. 대상 100개마다 실제 native observer
1개를 생성하고 observe/unobserve 각 100회, 대상 entry 100개 전달, 마지막 해제 때
disconnect 1회를 관찰했습니다. Mount sample마다 observer 생성/해제 각 20회,
대상 observe/unobserve 각 2,000회였으며 해당 batch 중 intersection callback은
0회였습니다. 두 실행 모두 마지막 pool 구독/observer와 fixture container는 0개입니다.

첫 GC checkpoint에서 두 실행 모두 해제 대상 0/100개, payload 0/100개, root
0/1개, native observer 0/1개가 살아 있었습니다. 반면 **대조군 대상 100/100개와
payload 100/100개는 생존**했습니다. 대조군 참조를 해제하고 다시 GC한 후에는 둘 다
0개였습니다. 브라우저/서버 종료와 원래 native observer 복원도 성공했습니다.
Byte 단위 보유량은 여전히 미측정입니다.

패키지 검증은 Vitest 24개 파일/209개 테스트, React 19 계약을 포함한 typecheck,
build 모두 통과했습니다. 벤치마크 스크립트 세 파일의 구문 검사와 language-server 진단도
통과했으며 잘못된 `--targets 0`은 거부했습니다. 최초 smoke에서 Vite 출력 배열
처리 오류를 발견하여 수정한 뒤 smoke와 두 기록 실행이 성공했습니다. 기록된 두 실행의
실패 sample을 제외한 적은 없습니다.

부모가 자체 완결된 lazy 할당 측정을 `lazy.js`로 분리해 파일 크기를 줄인 후 전체
측정을 두 번 다시 실행했습니다. 공개 JSON과 위 표는 그 최종 실행 결과입니다.
