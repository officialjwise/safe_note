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

  const login = (credentials: LoginRequest) => {
    return dispatch(loginThunk(credentials));
  };

  const register = (credentials: RegisterRequest) => {
    return dispatch(registerThunk(credentials));
  };

  const logout = () => {
    return dispatch(logoutThunk());
  };

  const checkAuth = () => {
    return dispatch(checkAuthThunk());
  };

  const clearErrorMessage = () => {
    dispatch(clearError());
  };

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
