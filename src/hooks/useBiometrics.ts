import { useCallback, useEffect, useState } from 'react';
import { biometricService, type BiometricAvailability } from '@services/biometricService';

export const useBiometrics = () => {
  const [availability, setAvailability] = useState<BiometricAvailability>({
    available: false,
  });
  const [isChecking, setIsChecking] = useState(true);
  const [failureCount, setFailureCount] = useState(0);

  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        const result = await biometricService.isBiometricAvailable();
        setAvailability(result);
      } catch (error) {
        console.error('Failed to check biometric availability:', error);
        setAvailability({ available: false });
      } finally {
        setIsChecking(false);
      }
    };

    checkBiometricAvailability();
  }, []);

  const authenticate = useCallback(async () => {
    if (!availability.available) {
      return false;
    }

    try {
      const success = await biometricService.authenticate();

      if (!success) {
        const newFailureCount = failureCount + 1;
        setFailureCount(newFailureCount);

        // After 3 failures, return false to show PIN fallback
        if (newFailureCount >= 3) {
          return false;
        }
      } else {
        setFailureCount(0); // Reset on success
      }

      return success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      const newFailureCount = failureCount + 1;
      setFailureCount(newFailureCount);
      return false;
    }
  }, [availability, failureCount]);

  const shouldShowBiometricPrompt = availability.available && failureCount < 3;

  return {
    isAvailable: availability.available,
    biometricsType: availability.biometricsType,
    isChecking,
    authenticate,
    shouldShowBiometricPrompt,
    failureCount,
  };
};
