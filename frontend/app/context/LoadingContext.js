'use client';
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const LoadingContext = createContext({
  isLoading: false,
  setLoading: () => {},
  startLoading: () => {},
  stopLoading: () => {},
});

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const activeTokens = useRef(new Set(['initial_mount']));
  const dismissTimer = useRef(null);
  const safetyTimeoutRef = useRef(null);

  const dismiss = useCallback((delay = 250) => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      setIsLoading(false);
    }, delay);
  }, []);

  const checkAndDismiss = useCallback((delay = 250) => {
    if (activeTokens.current.size === 0) {
      dismiss(delay);
    }
  }, [dismiss]);

  const startLoading = useCallback((token = 'default') => {
    const cleanToken = typeof token === 'string' ? token : 'default';
    activeTokens.current.add(cleanToken);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setIsLoading(true);

    // Hard safety timer: Never allow loader to stay visible for more than 1.8s
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    safetyTimeoutRef.current = setTimeout(() => {
      activeTokens.current.clear();
      setIsLoading(false);
    }, 1800);
  }, []);

  const stopLoading = useCallback(
    (tokenOrDelay, delayParam) => {
      let delay = 250;

      if (typeof tokenOrDelay === 'number') {
        // Called like stopLoading(300)
        delay = tokenOrDelay;
        activeTokens.current.clear();
      } else if (typeof tokenOrDelay === 'string') {
        // Called like stopLoading('analyses_page', 250)
        activeTokens.current.delete(tokenOrDelay);
        if (typeof delayParam === 'number') delay = delayParam;
      } else {
        // Called like stopLoading()
        activeTokens.current.clear();
      }

      if (activeTokens.current.size === 0) {
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
        dismiss(delay);
      }
    },
    [dismiss]
  );

  const setLoading = useCallback(
    (val, delay = 250) => {
      if (val) {
        startLoading();
      } else {
        stopLoading(delay);
      }
    },
    [startLoading, stopLoading]
  );

  // Initial mount: Release 'initial_mount' once document is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      activeTokens.current.delete('initial_mount');
      checkAndDismiss(150);
    }, 350);

    // Hard safety timer on initial page load
    const hardSafetyTimer = setTimeout(() => {
      activeTokens.current.clear();
      setIsLoading(false);
    }, 1800);

    return () => {
      clearTimeout(timer);
      clearTimeout(hardSafetyTimer);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [checkAndDismiss]);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        setLoading,
        startLoading,
        stopLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}

/**
 * Hook for pages to sync their data loading state with the global PageLoader.
 * When isPageLoading is true, the global PageLoader stays visible.
 * When isPageLoading becomes false, the global PageLoader smoothly fades away.
 */
export function usePageLoading(isPageLoading, customKey) {
  const { startLoading, stopLoading } = useLoading();
  const tokenRef = useRef(customKey || null);

  useEffect(() => {
    if (!tokenRef.current) {
      tokenRef.current = customKey || `page_${Math.random().toString(36).substring(2, 9)}`;
    }
    const token = tokenRef.current;

    if (isPageLoading) {
      startLoading(token);
    } else {
      stopLoading(token, 300);
    }

    return () => {
      stopLoading(token, 100);
    };
  }, [isPageLoading, customKey, startLoading, stopLoading]);
}
