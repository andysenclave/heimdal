import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="text-2xl font-display tracking-deco-tight text-deco-red">
              Something went wrong
            </div>
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
        )
      );
    }

    return this.props.children;
  }
}
