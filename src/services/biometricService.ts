import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricAvailability {
  available: boolean;
  biometricsType?: 'Fingerprint' | 'FaceID' | 'Iris' | 'Unknown';
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
      
      let biometricsType: 'Fingerprint' | 'FaceID' | 'Iris' | 'Unknown' = 'Unknown';
      
      // Check for Face ID (iOS 11+ and all modern Android)
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricsType = 'FaceID';
      }
      // Check for Fingerprint
      else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricsType = 'Fingerprint';
      }
      // Check for Iris (less common but still supported)
      else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricsType = 'Iris';
      }

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
      const biometricAvailable = await this.isBiometricAvailable();
      const fallbackLabel = !biometricAvailable.available 
        ? 'Use Password' 
        : biometricAvailable.biometricsType === 'FaceID' 
        ? 'Use Face ID' 
        : biometricAvailable.biometricsType === 'Fingerprint'
        ? 'Use Fingerprint'
        : 'Use Biometric';

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel,
        disableDeviceFallback: false,
        // For iOS: Allow FaceID with passcode fallback
        // For Android: Allow both biometric and device unlock
        requireConfirmation: Platform.OS === 'ios' ? true : false,
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

  // Helper method to get user-friendly biometric name
  async getBiometricDisplayName(): Promise<string> {
    const availability = await this.isBiometricAvailable();
    if (!availability.available) {
      return 'Biometric Authentication';
    }
    
    switch (availability.biometricsType) {
      case 'FaceID':
        return 'Face ID';
      case 'Fingerprint':
        return 'Fingerprint';
      case 'Iris':
        return 'Iris Recognition';
      default:
        return 'Biometric';
    }
  },
};
