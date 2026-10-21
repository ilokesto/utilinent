export const landingPackages = [
  {
    name: 'utilinent',
    title: 'Utilinent',
    en: 'Compose conditional and asynchronous React interfaces.',
    ko: '조건부 렌더링과 비동기 React UI를 조합하세요.',
  },
] as const;

export type LandingPackage = (typeof landingPackages)[number];

export function getLandingPackage(name: string) {
  return landingPackages.find(item => item.name === name);
}
