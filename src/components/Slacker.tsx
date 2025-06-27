import { useState, useEffect, ReactNode } from "react";
import { Observer } from "./Observer";
import { SlackerProps } from "./types";

/**
 * Slacker 컴포넌트 - Lazy Loading 전용
 * 
 * 뷰포트에 보이지 않을 때는 fallback을 표시하고,
 * 뷰포트에 들어오면 loader를 실행하여 데이터를 로드한 후
 * children 함수에 로드된 데이터를 전달하여 렌더링합니다.
 * 한 번 로드되면 다시 되돌리지 않습니다 (triggerOnce=true).
 * 
 * @example
 * ```tsx
 * // 컴포넌트 lazy loading
 * <Slacker 
 *   fallback={<ChartSkeleton />}
 *   loader={async () => {
 *     const { HeavyChart } = await import('./HeavyChart');
 *     return HeavyChart;
 *   }}
 * >
 *   {(Component) => <Component data={data} />}
 * </Slacker>
 * 
 * // 데이터 lazy loading
 * <Slacker 
 *   fallback={<div>Loading data...</div>}
 *   loader={async () => {
 *     const response = await fetch('/api/data');
 *     return response.json();
 *   }}
 * >
 *   {(data) => (
 *     <div>
 *       <h2>{data.title}</h2>
 *       <p>{data.description}</p>
 *     </div>
 *   )}
 * </Slacker>
 * 
 * // 라이브러리와 데이터 함께 로딩
 * <Slacker 
 *   fallback={<div>Loading chart library...</div>}
 *   loader={async () => {
 *     const [{ Chart }, chartData] = await Promise.all([
 *       import('chart.js'),
 *       fetch('/api/chart-data').then(r => r.json())
 *     ]);
 *     return { Chart, data: chartData };
 *   }}
 * >
 *   {({ Chart, data }) => <Chart data={data} />}
 * </Slacker>
 * 
 * // 이미지와 메타데이터 함께 로딩
 * <Slacker 
 *   fallback={<ImageSkeleton />}
 *   loader={async () => {
 *     const [imageUrl, metadata] = await Promise.all([
 *       loadHighResImage(id),
 *       fetch(`/api/images/${id}/metadata`).then(r => r.json())
 *     ]);
 *     return { imageUrl, metadata };
 *   }}
 * >
 *   {({ imageUrl, metadata }) => (
 *     <div>
 *       <img src={imageUrl} alt={metadata.title} />
 *       <p>{metadata.description}</p>
 *     </div>
 *   )}
 * </Slacker>
 * ```
 */
export function Slacker({
  children,
  fallback,
  loader,
  threshold = 0.1,
  rootMargin = "50px",
}: SlackerProps) {
  const [loadedData, setLoadedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleIntersect = async (isIntersecting: boolean) => {
    if (isIntersecting && !hasLoaded) {
      setIsLoading(true);
      try {
        const data = await loader();
        setLoadedData(data);
        setHasLoaded(true);
      } catch (error) {
        console.error('Slacker loader failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Observer
      threshold={threshold}
      rootMargin={rootMargin}
      fallback={fallback}
      triggerOnce={true}
      onIntersect={handleIntersect}
    >
      {hasLoaded ? children(loadedData) : null}
    </Observer>
  );
}
