import { type ComponentType } from 'react';

interface WithLoadingProps {
  isLoading: boolean;
}

export function withLoading<P extends object>(Component: ComponentType<P>) {
  function WithLoadingWrapper(props: P & WithLoadingProps) {
    const { isLoading, ...rest } = props;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 rounded-full border-2 border-deco-amber border-t-transparent animate-deco-spin" />
        </div>
      );
    }

    return <Component {...(rest as P)} />;
  }

  WithLoadingWrapper.displayName = `withLoading(${Component.displayName ?? Component.name ?? 'Component'})`;
  return WithLoadingWrapper;
}
