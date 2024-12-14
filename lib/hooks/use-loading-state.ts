import { useState, useCallback } from 'react';

export interface LoadingState {
  [key: string]: boolean;
}

export function useLoadingState<T extends LoadingState>(initialState: T) {
  const [loadingState, setLoadingState] = useState<T>(initialState);

  const startLoading = useCallback((key: keyof T) => {
    setLoadingState(prev => ({ ...prev, [key]: true }));
  }, []);

  const stopLoading = useCallback((key: keyof T) => {
    setLoadingState(prev => ({ ...prev, [key]: false }));
  }, []);

  const withLoading = useCallback(async <R>(key: keyof T, operation: () => Promise<R>): Promise<R> => {
    startLoading(key);
    try {
      return await operation();
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading: useCallback((key: keyof T) => loadingState[key], [loadingState]),
    startLoading,
    stopLoading,
    withLoading,
  };
}
