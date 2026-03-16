/**
 * Environment Configuration
 * Centralizes all environment-specific settings for the app
 */

const getApiUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv;
  }

  if (__DEV__) {
    return 'http://localhost:8000/api/v1';
  }

  return 'https://api.securenotes.app/api/v1';
};

const ENV = {
  dev: {
    API_BASE_URL: getApiUrl(),
    DEBUG: true,
    LOG_REQUESTS: true,
  },
  prod: {
    API_BASE_URL: 'https://api.securenotes.app/api/v1',
    DEBUG: false,
    LOG_REQUESTS: false,
  },
  staging: {
    API_BASE_URL: 'https://staging-api.securenotes.app/api/v1',
    DEBUG: true,
    LOG_REQUESTS: true,
  },
};

// Determine which environment we're in
const getEnv = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export const Config = getEnv();
