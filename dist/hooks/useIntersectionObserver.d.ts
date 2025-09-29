interface UseIntersectionObserverOptions {
    threshold?: number | number[];
    root?: Element | null;
    rootMargin?: string;
    freezeOnceVisible?: boolean;
    initialIsIntersecting?: boolean;
    onChange?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
}
interface UseIntersectionObserverResult {
    ref: (node: HTMLElement | null) => void;
    isIntersecting: boolean;
    entry: IntersectionObserverEntry | undefined;
}
export declare function useIntersectionObserver({ threshold, root, rootMargin, freezeOnceVisible, initialIsIntersecting, onChange, }?: UseIntersectionObserverOptions): UseIntersectionObserverResult;
export {};
