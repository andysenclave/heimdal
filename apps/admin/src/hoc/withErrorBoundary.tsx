import { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryWrapper extends Component<{ children: ReactNode; fallback?: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="text-2xl font-display tracking-deco-tight text-deco-red">Something went wrong</div>
          <p className="font-mono text-xs text-deco-text-dim">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded border border-deco-border bg-deco-raised px-4 py-2 font-mono text-xs text-deco-text-soft hover:bg-deco-surface-hover"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(Component: ComponentType<P>, fallback?: ReactNode) {
  function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundaryWrapper fallback={fallback}>
        <Component {...props} />
      </ErrorBoundaryWrapper>
    );
  }

  WithErrorBoundaryWrapper.displayName = `withErrorBoundary(${Component.displayName ?? Component.name ?? 'Component'})`;
  return WithErrorBoundaryWrapper;
}
