import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_TIMEOUT_MINUTES = 15;
const INACTIVITY_TIMEOUT_MINUTES = 10;
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;
const INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;

/**
 * useSessionTimeout Hook
 * 
 * Security features:
 * - Automatically logs out user after inactivity
 * - Invalidates session when app goes to background for too long
 * - Warns user before logout
 * - Clears sensitive data on logout
 * 
 * OWASP A07: Authentication and Session Management
 */
export const useSessionTimeout = () => {
  const { logout } = useAuth();
  const appStateRef = useRef<AppStateStatus>('active');
  const inactivityTimeoutRef = useRef<number | undefined>(undefined);
  const warningTimeoutRef = useRef<number | undefined>(undefined);
  const backgroundTimeRef = useRef<number>(0);

  const clearAllTimeouts = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
  }, []);

  const handleSessionWarning = useCallback(async () => {
    const lastActivity = await AsyncStorage.getItem('last_activity');
    if (lastActivity) {
      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      if (timeSinceActivity >= INACTIVITY_TIMEOUT_MS * 0.8) {
        // Log warning event for audit logging
        console.warn('[SECURITY] Session timeout warning - user will be logged out');
      }
    }
  }, []);

  const handleInactivityLogout = useCallback(async () => {
    console.warn('[SECURITY] Inactivity timeout - logging out user');
    
    // Clear all sensitive data
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('last_activity');
    
    // Logout
    logout();
  }, [logout]);

  const resetInactivityTimer = useCallback(() => {
    clearAllTimeouts();

    // Store activity timestamp
    AsyncStorage.setItem('last_activity', Date.now().toString());

    // Warning at 80% of timeout
    warningTimeoutRef.current = setTimeout(
      handleSessionWarning,
      INACTIVITY_TIMEOUT_MS * 0.8
    );

    // Logout at full timeout
    inactivityTimeoutRef.current = setTimeout(
      handleInactivityLogout,
      INACTIVITY_TIMEOUT_MS
    );
  }, [clearAllTimeouts, handleSessionWarning, handleInactivityLogout]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
      // App moved to background
      backgroundTimeRef.current = Date.now();
      clearAllTimeouts();
    } else if (
      (appStateRef.current === 'inactive' || appStateRef.current === 'background') &&
      nextAppState === 'active'
    ) {
      // App came back to foreground
      const backgroundDuration = Date.now() - backgroundTimeRef.current;
      
      if (backgroundDuration >= SESSION_TIMEOUT_MS) {
        // User was in background too long - logout
        handleInactivityLogout();
      } else {
        // Resume activity timer
        resetInactivityTimer();
      }
    }

    appStateRef.current = nextAppState;
  }, [clearAllTimeouts, handleInactivityLogout, resetInactivityTimer]);

  useEffect(() => {
    // Initialize activity timer on mount
    resetInactivityTimer();

    // Subscribe to app state changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearAllTimeouts();
      appStateSubscription.remove();
    };
  }, [resetInactivityTimer, handleAppStateChange, clearAllTimeouts]);

  return {
    resetInactivityTimer,
    inactivityTimeoutMinutes: INACTIVITY_TIMEOUT_MINUTES,
  };
};
