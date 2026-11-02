import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Props for {@link ErrorBoundary}.
 *
 * `fallback` — ReactNode or a render-prop receiving `{ error, reset }`.
 * `onError` — called when a descendant throws during render.
 * `resetKeys` — when these values change, the boundary resets its error state.
 */
export interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode | ((state: { error: Error; reset: () => void }) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
  resetKeys?: readonly unknown[];
}

interface ErrorBoundaryState {
  error: Error | undefined;
}

/**
 * @description Catches render errors in descendants and renders `fallback` instead.
 *
 * Pair with {@link Mount} (which handles async errors) to cover both
 * synchronous render errors and asynchronous factory errors.
 * @param {ErrorBoundaryProps} props - Boundary content and recovery options.
 * @param {ReactNode} [props.children] - Descendants protected by the boundary.
 * @param {ReactNode | ((state: { error: Error; reset: () => void }) => ReactNode)} [props.fallback] - Error content or renderer.
 * @param {(error: Error, info: ErrorInfo) => void} [props.onError] - Caught-error callback.
 * @param {readonly unknown[]} [props.resetKeys] - Replacing this array clears an active error.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={({ error, reset }) => <button onClick={reset}>Retry</button>}>
 *   <RiskyWidget />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: undefined };

  /**
   * @description Converts a descendant render error into boundary state.
   * @param {Error} error - Error caught by React.
   * @returns {ErrorBoundaryState} The error state.
   * - error `Error` - The caught error.
   * @example
   * ```ts
   * const state = ErrorBoundary.getDerivedStateFromError(new Error("Render failed"));
   * ```
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  /**
   * @description Reports a descendant failure through the optional onError callback.
   * @param {Error} error - Caught descendant error.
   * @param {ErrorInfo} info - React component-stack information.
   * @returns {void} No return value.
   * @example
   * ```tsx
   * <ErrorBoundary onError={(error, info) => report(error, info)}>
   *   <RiskyWidget />
   * </ErrorBoundary>
   * // React invokes componentDidCatch after catching a descendant error.
   * ```
   */
  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  /**
   * @description Clears an active error when the resetKeys array identity changes.
   * @param {ErrorBoundaryProps} prevProps - Props from the previous committed render.
   * @param {ReactNode} [prevProps.children] - Previously protected content.
   * @param {ReactNode | ((state: { error: Error; reset: () => void }) => ReactNode)} [prevProps.fallback] - Previous error content.
   * @param {(error: Error, info: ErrorInfo) => void} [prevProps.onError] - Previous error callback.
   * @param {readonly unknown[]} [prevProps.resetKeys] - Previous reset key array.
   * @returns {void} No return value.
   * @example
   * ```tsx
   * <ErrorBoundary resetKeys={routeKeys}><Page /></ErrorBoundary>
   * // React invokes componentDidUpdate after new routeKeys are committed.
   * ```
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.error && prevProps.resetKeys !== this.props.resetKeys) {
      this.setState({ error: undefined });
    }
  }

  /**
   * @description Clears the current error so descendants can render again.
   * @returns {void} No return value.
   * @example
   * ```tsx
   * <ErrorBoundary fallback={({ reset }) => <button onClick={reset}>Retry</button>}>
   *   <RiskyWidget />
   * </ErrorBoundary>
   * ```
   */
  reset = (): void => {
    this.setState({ error: undefined });
  };

  /**
   * @description Selects protected children or the current error fallback.
   * @returns {ReactNode} Children when healthy, otherwise the fallback result or null.
   * @example
   * ```tsx
   * <ErrorBoundary fallback={<p>Unavailable</p>}><RiskyWidget /></ErrorBoundary>
   * // React calls render to select the current content.
   * ```
   */
  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    const { fallback } = this.props;
    if (typeof fallback === "function") {
      return fallback({ error, reset: this.reset });
    }
    return fallback ?? null;
  }
}
