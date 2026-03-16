import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@hooks/useAuth';
import { useBiometrics } from '@hooks/useBiometrics';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { BiometricPrompt, LoadingSpinner } from '@components/shared';
import { COLORS } from '@constants';

// Auth state is local-only in this build and managed via Redux + AsyncStorage.

const Stack = createStackNavigator();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, loading, checkAuth } = useAuth();
  const { isAvailable, authenticate, shouldShowBiometricPrompt } = useBiometrics();
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);

  // Check for an active local session on cold start.
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Failed to check auth:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    initializeAuth();
  }, [checkAuth]);

  // Show biometric overlay when the app returns to foreground while authenticated.
  useEffect(() => {
    if (isAuthenticated && shouldShowBiometricPrompt && isAvailable) {
      setShowBiometricPrompt(true);
    } else {
      setShowBiometricPrompt(false);
    }
  }, [isAuthenticated, shouldShowBiometricPrompt, isAvailable]);

  const handleInactivityTimeout = () => {
    // useAuth.logout clears local session and resets Redux state,
    // which flips isAuthenticated → false and drives navigation automatically.
  };

  const handleBiometricAuth = async () => {
    setIsBiometricAuthenticating(true);
    try {
      const success = await authenticate();
      setShowBiometricPrompt(false);
    } finally {
      setIsBiometricAuthenticating(false);
    }
  };

  const handleBiometricFallback = () => {
    setShowBiometricPrompt(false);
  };

  if (isCheckingAuth) {
    return <LoadingSpinner visible={true} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animationEnabled: true,
            cardStyle: { backgroundColor: COLORS.primaryBackground },
          }}
        >
          {!isAuthenticated ? (
            <Stack.Group screenOptions={{ animationTypeForReplace: 'pop' }}>
              <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
            </Stack.Group>
          ) : (
            <Stack.Group screenOptions={{ animationTypeForReplace: 'push' }}>
              <Stack.Screen name="MainNavigator" component={MainNavigator} />
            </Stack.Group>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {showBiometricPrompt && (
        <BiometricPrompt
          visible={showBiometricPrompt}
          onAuthenticate={handleBiometricAuth}
          onUsePinInstead={handleBiometricFallback}
          loading={isBiometricAuthenticating}
        />
      )}
    </View>
  );
};

export default RootNavigator;// Navigation state management and inactivity handling
