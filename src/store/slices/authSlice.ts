import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User, LoginRequest, RegisterRequest } from '@types';
import { apiClient } from '@services/apiClient';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY_SESSION_USER = 'securenotes_session_user';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Helper to create User object from email and server response
const createUserFromEmail = (email: string, id?: string): User => ({
  id: id || `user_${Date.now()}`,
  email: email.trim().toLowerCase(),
  createdAt: new Date().toISOString(),
});

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.login(
        credentials.email.trim().toLowerCase(),
        credentials.password
      );

      if (response.error || !response.data) {
        return rejectWithValue(response.error || 'Login failed');
      }

      // Create user object from login email (server will return user data in future versions)
      const user = createUserFromEmail(credentials.email);
      await AsyncStorage.setItem(STORAGE_KEY_SESSION_USER, JSON.stringify(user));
      
      return { user };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.register(
        credentials.email.trim().toLowerCase(),
        credentials.password
      );

      if (response.error) {
        return rejectWithValue(response.error || 'Registration failed');
      }

      // After successful registration, login with the same credentials
      const loginResponse = await apiClient.login(
        credentials.email.trim().toLowerCase(),
        credentials.password
      );

      if (loginResponse.error || !loginResponse.data) {
        return rejectWithValue('Account created but login failed - try logging in');
      }

      const user = createUserFromEmail(credentials.email);
      await AsyncStorage.setItem(STORAGE_KEY_SESSION_USER, JSON.stringify(user));
      
      return { user };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Registration failed');
    }
  }
);

export const logoutThunk = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await apiClient.logout();
    await AsyncStorage.removeItem(STORAGE_KEY_SESSION_USER);
    return null;
  } catch (error) {
    // Even if logout API fails, clear local session
    await AsyncStorage.removeItem(STORAGE_KEY_SESSION_USER);
    return null;
  }
});

export const refreshTokenThunk = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      // Try to refresh via API
      // The apiClient automatically handles token refresh via interceptors
      const currentSession = await AsyncStorage.getItem(STORAGE_KEY_SESSION_USER);
      if (!currentSession) {
        return rejectWithValue('No active session');
      }

      const user = JSON.parse(currentSession) as User;
      return { user };
    } catch {
      return rejectWithValue('Token refresh failed');
    }
  }
);

export const checkAuthThunk = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      // Load tokens from secure storage
      await apiClient.loadTokens();
      
      // Check if session exists locally
      const sessionData = await AsyncStorage.getItem(STORAGE_KEY_SESSION_USER);
      if (!sessionData) {
        return rejectWithValue('No active session');
      }

      const user = JSON.parse(sessionData) as User;
      return { user };
    } catch {
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
      })
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
      })
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
      })
      .addCase(checkAuthThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuthThunk.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(refreshTokenThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(refreshTokenThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
  },
});

export const { setError, clearError } = authSlice.actions;
export default authSlice.reducer;