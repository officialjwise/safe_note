import { useEffect, useRef, useCallback } from 'react';
import { AppState, PanResponder } from 'react-native';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export const useInactivityTimer = (onTimeout: () => void, enabled: boolean = true) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const lastActivityRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (enabled) {
      timerRef.current = setTimeout(() => {
        onTimeout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [enabled, onTimeout]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    resetTimer();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, resetTimer]);

  const handleAppStateChange = useCallback(
    (state: any) => {
      if (state === 'active') {
        // App came to foreground
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;

        if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
          onTimeout();
        } else {
          resetTimer();
        }
      } else if (state === 'background') {
        // App went to background
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      }

      appStateRef.current = state;
    },
    [resetTimer, onTimeout]
  );

  // Create PanResponder for touch detection
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => {
      resetTimer();
      return false;
    },
    onMoveShouldSetPanResponder: () => {
      resetTimer();
      return false;
    },
  });

  return {
    panResponders: panResponder.panHandlers,
    resetTimer,
  };
};
