import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricAvailability {
  available: boolean;
  biometricsType?: 'Fingerprint' | 'FaceID' | 'Iris';
}

export const biometricService = {
  async isBiometricAvailable(): Promise<BiometricAvailability> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return { available: false };
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const biometricsType = supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
      )
        ? 'FaceID'
        : supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ? 'Fingerprint'
        : 'Iris';

      return {
        available: true,
        biometricsType,
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return { available: false };
    }
  },

  async authenticate(reason: string = 'Unlock SecureNotes'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  },

  async createSignature(reason: string = 'Authenticate'): Promise<string | null> {
    return null;
  },
};
