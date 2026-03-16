import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@store';
import {
  loginThunk,
  registerThunk,
  logoutThunk,
  checkAuthThunk,
  clearError,
} from '@store/slices/authSlice';
import type { LoginRequest, RegisterRequest } from '@types';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const login = useCallback((credentials: LoginRequest) => {
    return dispatch(loginThunk(credentials));
  }, [dispatch]);

  const register = useCallback((credentials: RegisterRequest) => {
    return dispatch(registerThunk(credentials));
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch(logoutThunk());
  }, [dispatch]);

  const checkAuth = useCallback(() => {
    return dispatch(checkAuthThunk());
  }, [dispatch]);

  const clearErrorMessage = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
    clearErrorMessage,
  };
};
// Authentication hook for managing user sessions
