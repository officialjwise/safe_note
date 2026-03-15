import * as Keychain from 'react-native-keychain';

const ACCESS_TOKEN_KEY = 'securenotes_access_token';
const REFRESH_TOKEN_KEY = 'securenotes_refresh_token';

export const tokenStorage = {
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await Keychain.setGenericPassword(
        ACCESS_TOKEN_KEY,
        JSON.stringify({ accessToken, refreshToken }),
        {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }
      );
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        const { accessToken } = JSON.parse(credentials.password);
        return accessToken;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        const { refreshToken } = JSON.parse(credentials.password);
        return refreshToken;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  },

  async getTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        return JSON.parse(credentials.password);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving tokens:', error);
      return null;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await Keychain.resetGenericPassword();
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  },
};
