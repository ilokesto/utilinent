import { Braces } from 'lucide-react';

export type Locale = 'en' | 'ko';
export type PackageName = 'utilinent';

export type PackageCard = {
  readonly pkg: PackageName;
  readonly descriptions: Record<Locale, string>;
  readonly support: Record<Locale, string>;
  readonly beta?: boolean;
};

export const packageCards: readonly PackageCard[] = [
  {
    pkg: 'utilinent',
    descriptions: {
      en: 'Composable React utilities for conditional rendering, asynchronous states, and common browser interactions.',
      ko: '조건부 렌더링, 비동기 상태, 자주 쓰는 브라우저 동작을 위한 조합형 React 유틸리티입니다.',
    },
    support: { en: 'React 18 and later', ko: 'React 18 이상' },
  },
];

export const packageGroups = [{ id: 'utilities', packages: ['utilinent'], icon: Braces }] as const;

export const homeCopy = {
  en: {
    eyebrow: 'Small tools. Explicit contracts.',
    title: 'Make conditional React interfaces easier to read.',
    subtitle: 'Utilinent provides small, composable components for conditional rendering, lists, and asynchronous UI states.',
    browse: 'Explore Utilinent',
    beta: 'Beta',
    support: 'Support',
    packagesEyebrow: 'The toolbox',
    packagesTitle: 'Start with the interface you are building.',
    packagesBody: 'Use the React utilities that fit the states and interactions in your application.',
    groups: {
      utilities: {
        title: 'React utilities',
        description: 'Choose declarative components for branches, lists, loading states, and browser behavior.',
      },
    },
    packageExplore: 'Explore package',
    packageQuickStart: 'Quick start',
    chooseEyebrow: 'Choose a rendering primitive',
    chooseTitle: 'Keep each UI state explicit.',
    choices: [
      {
        question: 'Conditional branches or repeated content?',
        answer: 'Use Show, Switch, and Match for branches; use For for repeated content and its empty state.',
      },
      {
        question: 'Asynchronous content or immediate content?',
        answer: 'Use Mount to render direct nodes immediately or resolve a factory while retaining a clear fallback and error path.',
      },
    ],
  },
  ko: {
    eyebrow: '작은 도구, 명확한 동작',
    title: '조건부 React 화면을 더 읽기 쉽게 만드세요.',
    subtitle: 'Utilinent는 조건부 렌더링, 목록, 비동기 UI 상태를 위한 작고 조합 가능한 컴포넌트를 제공합니다.',
    browse: 'Utilinent 살펴보기',
    beta: '베타',
    support: '지원 환경',
    packagesEyebrow: '도구상자',
    packagesTitle: '만들고 있는 화면에서 시작하세요.',
    packagesBody: '애플리케이션의 상태와 상호작용에 맞는 React 유틸리티를 사용하세요.',
    groups: {
      utilities: {
        title: 'React 유틸리티',
        description: '분기, 목록, 로딩 상태와 브라우저 동작을 선언적으로 표현합니다.',
      },
    },
    packageExplore: '패키지 살펴보기',
    packageQuickStart: '빠른 시작',
    chooseEyebrow: '렌더링 프리미티브 선택하기',
    chooseTitle: '각 UI 상태를 명확하게 표현하세요.',
    choices: [
      {
        question: '조건 분기와 반복 콘텐츠 중 무엇인가요?',
        answer: '분기에는 Show, Switch, Match를 사용하고, 반복 콘텐츠와 빈 상태에는 For를 사용하세요.',
      },
      {
        question: '비동기 콘텐츠와 즉시 표시할 콘텐츠 중 무엇인가요?',
        answer: 'Mount는 React 노드를 바로 렌더링하거나 명확한 대체 UI와 오류 경로를 두고 팩토리 결과를 처리합니다.',
      },
    ],
  },
} as const;
