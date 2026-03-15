import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@services/api';
import { tokenStorage } from '@utils/tokenStorage';
import type { User, LoginRequest, RegisterRequest, LoginResponse } from '@types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await api.post<LoginResponse>('/v1/auth/login', credentials);
      const { accessToken, refreshToken, user } = response.data;

      await tokenStorage.setTokens(accessToken, refreshToken);

      return { user, accessToken, refreshToken };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await api.post<LoginResponse>('/v1/auth/register', credentials);
      const { accessToken, refreshToken, user } = response.data;

      await tokenStorage.setTokens(accessToken, refreshToken);

      return { user, accessToken, refreshToken };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const refreshTokenThunk = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        return rejectWithValue('No refresh token available');
      }

      const response = await api.post('/v1/auth/refresh', {
        refresh_token: refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      await tokenStorage.setTokens(accessToken, newRefreshToken);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/v1/auth/logout');
      await tokenStorage.clearTokens();
      return null;
    } catch (error: any) {
      await tokenStorage.clearTokens();
      return null;
    }
  }
);

export const checkAuthThunk = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const tokens = await tokenStorage.getTokens();
      if (!tokens) {
        return rejectWithValue('No tokens found');
      }

      // Verify tokens are still valid by making a minimal API call
      const response = await api.get('/v1/auth/me');
      return response.data;
    } catch (error: any) {
      await tokenStorage.clearTokens();
      return rejectWithValue('Auth check failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      });

    // Refresh Token
    builder
      .addCase(refreshTokenThunk.pending, (state) => {
        // Don't set loading to true for refresh
      })
      .addCase(refreshTokenThunk.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(refreshTokenThunk.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // Check Auth
    builder
      .addCase(checkAuthThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuthThunk.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setError, clearError } = authSlice.actions;
export default authSlice.reducer;
