import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '@constants/environment';
import { logger } from './logger';

const API_BASE_URL = Config.API_BASE_URL;

export interface ApiResponse<T = any> {
  data?: T;
  detail?: string;
  error?: string;
  statusCode?: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenKey = 'securenotes_access_token';
  private refreshTokenKey = 'securenotes_refresh_token';

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    try {
      await AsyncStorage.multiSet([
        [this.tokenKey, accessToken],
        [this.refreshTokenKey, refreshToken],
      ]);
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  async loadTokens(): Promise<{ access: string | null; refresh: string | null }> {
    try {
      const [accessToken, refreshToken] = await AsyncStorage.multiGet([
        this.tokenKey,
        this.refreshTokenKey,
      ]);

      this.accessToken = accessToken[1];
      this.refreshToken = refreshToken[1];

      return { access: accessToken[1], refresh: refreshToken[1] };
    } catch (error) {
      console.error('Failed to load tokens:', error);
      return { access: null, refresh: null };
    }
  }

  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;

    try {
      await AsyncStorage.multiRemove([this.tokenKey, this.refreshTokenKey]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  private async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const options: RequestInit = {
        method,
        headers,
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      logger.logNetworkRequest(method, endpoint, body ? '***' : undefined, headers);

      const response = await fetch(url, options);
      const duration = Date.now() - startTime;

      // Handle 401 - try to refresh token
      if (response.status === 401 && this.refreshToken) {
        logger.warn('NETWORK', `${method} ${endpoint} - 401 Unauthorized`, {}, 'ApiClient');
        try {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            logger.info('AUTH', 'Token refreshed, retrying request', {}, 'ApiClient');
            // Retry the original request with new token
            return this.request(method, endpoint, body);
          }
        } catch (refreshError) {
          await this.clearTokens();
          logger.error('AUTH', 'Token refresh failed', refreshError, 'ApiClient');
          return {
            error: 'Authentication required. Please login again.',
            statusCode: 401,
          };
        }
      }

      const data = await response.json();
      logger.logNetworkResponse(method, endpoint, response.status, data, duration);

      if (!response.ok) {
        return {
          error: data.detail || data.error || `Request failed with status ${response.status}`,
          statusCode: response.status,
        };
      }

      return { data, statusCode: response.status };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.logNetworkError(method, endpoint, error, duration);
      return { error: errorMessage };
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const url = `${API_BASE_URL}/auth/refresh`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as TokenResponse;
      await this.setTokens(data.access_token, data.refresh_token);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Auth endpoints
  async register(email: string, password: string): Promise<ApiResponse> {
    logger.logAuthEvent('Register attempt', { email });
    const response = await this.request('POST', '/auth/register', {
      email,
      password,
    });
    if (response.data) {
      logger.logAuthEvent('Register successful', { email });
    } else {
      logger.logAuthError('Register failed', { email, error: response.error });
    }
    return response;
  }

  async login(email: string, password: string): Promise<ApiResponse<TokenResponse>> {
    logger.logAuthEvent('Login attempt', { email });
    const response = await this.request<TokenResponse>('POST', '/auth/login', {
      email,
      password,
    });

    if (response.data) {
      const { access_token, refresh_token } = response.data;
      await this.setTokens(access_token, refresh_token);
      logger.logAuthEvent('Login successful', { email });
    } else {
      logger.logAuthError('Login failed', { email, error: response.error });
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    logger.logAuthEvent('Logout attempt');
    try {
      await this.request('POST', '/auth/logout');
    } catch (error) {
      logger.error('AUTH', 'Logout request failed', error, 'ApiClient');
    }
    await this.clearTokens();
    logger.logAuthEvent('Logout successful');
    return { statusCode: 200 };
  }

  async requestPasswordReset(email: string): Promise<ApiResponse> {
    logger.logAuthEvent('Password reset requested', { email });
    const response = await this.request('POST', '/auth/password-reset/request', {
      email,
    });
    if (!response.error) {
      logger.logAuthEvent('Password reset initiated', { email });
    } else {
      logger.logAuthError('Password reset request failed', { email, error: response.error });
    }
    return response;
  }

  async verifyResetCode(email: string, code: string): Promise<ApiResponse> {
    logger.logAuthEvent('Password reset code verification', { email, code: '***' });
    const response = await this.request('POST', '/auth/password-reset/verify', {
      email,
      code,
    });
    if (!response.error) {
      logger.logAuthEvent('Password reset code verified', { email });
    } else {
      logger.logAuthError('Password reset code verification failed', { email });
    }
    return response;
  }

  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<ApiResponse> {
    logger.logAuthEvent('Password reset confirmation', { email });
    const response = await this.request('POST', '/auth/password-reset/confirm', {
      email,
      code,
      new_password: newPassword,
    });
    if (!response.error) {
      logger.logAuthEvent('Password reset completed', { email });
    } else {
      logger.logAuthError('Password reset failed', { email, error: response.error });
    }
    return response;
  }

  // Notes endpoints
  async getNotes(): Promise<ApiResponse<any[]>> {
    return this.request('GET', '/notes');
  }

  async searchNotes(query: string): Promise<ApiResponse<any[]>> {
    const endpoint = `/notes/search?q=${encodeURIComponent(query)}`;
    return this.request('GET', endpoint);
  }

  async getNote(id: string): Promise<ApiResponse<any>> {
    return this.request('GET', `/notes/${id}`);
  }

  async createNote(title: string, content: string): Promise<ApiResponse<any>> {
    return this.request('POST', '/notes', {
      title,
      body: content, // API expects 'body', not 'content'
    });
  }

  async updateNote(id: string, title: string, content: string): Promise<ApiResponse<any>> {
    return this.request('PUT', `/notes/${id}`, {
      title,
      body: content, // API expects 'body', not 'content'
    });
  }

  async deleteNote(id: string): Promise<ApiResponse> {
    return this.request('DELETE', `/notes/${id}`);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
