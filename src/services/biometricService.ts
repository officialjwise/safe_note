import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export interface BiometricAvailability {
  available: boolean;
  biometricsType?: 'Fingerprint' | 'FaceID' | 'Iris';
}

export const biometricService = {
  async isBiometricAvailable(): Promise<BiometricAvailability> {
    try {
      const result = await rnBiometrics.isSensorAvailable();
      
      if (!result.available) {
        return { available: false };
      }

      return {
        available: true,
        biometricsType: result.biometryType === 'FaceID'
          ? 'FaceID'
          : result.biometryType === 'TouchID'
          ? 'Fingerprint'
          : result.biometryType === 'Biometrics'
          ? 'Fingerprint'
          : 'Iris',
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return { available: false };
    }
  },

  async authenticate(reason: string = 'Unlock SecureNotes'): Promise<boolean> {
    try {
      const result = await rnBiometrics.simplePrompt({
        promptMessage: reason,
        fallbackPromptMessage: 'Use your PIN instead',
      });

      return result.success === true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  },

  async createSignature(reason: string = 'Authenticate'): Promise<string | null> {
    try {
      const result = await rnBiometrics.isSensorAvailable();
      
      if (!result.available) {
        return null;
      }

      const signatureResult = await rnBiometrics.createSignature({
        promptMessage: reason,
        payload: new Date().toISOString(),
      });

      if (signatureResult.success) {
        return signatureResult.signature || null;
      }

      return null;
    } catch (error) {
      console.error('Failed to create biometric signature:', error);
      return null;
    }
  },
};
