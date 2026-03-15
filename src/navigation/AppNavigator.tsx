import React, { useEffect, useState, useRef } from 'react';
import { View, PanResponder } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@hooks/useAuth';
import { useInactivityTimer } from '@hooks/useInactivityTimer';
import { useBiometrics } from '@hooks/useBiometrics';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { BiometricPrompt, LoadingSpinner } from '@components/shared';
import { COLORS } from '@constants';

// AsyncStorage removed — auth state comes from the secure token store
// via useAuth (react-native-keychain), not from AsyncStorage directly.

const Stack = createStackNavigator();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, loading, checkAuth } = useAuth();
  const { isAvailable, authenticate, shouldShowBiometricPrompt } = useBiometrics();
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);

  // Check for a valid stored token on cold start.
  // useAuth.checkAuth reads from react-native-keychain — no AsyncStorage needed.
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
    }
  }, [isAuthenticated, shouldShowBiometricPrompt, isAvailable]);

  const handleInactivityTimeout = () => {
    // useAuth.logout clears Keychain tokens and resets Redux state,
    // which flips isAuthenticated → false and drives navigation automatically.
  };

  // useInactivityTimer returns a PanResponder instance, not its handlers directly.
  // Spread panResponder.panHandlers onto the View, not the responder object itself.
  const panResponder = useInactivityTimer(handleInactivityTimeout, isAuthenticated);

  const handleBiometricAuth = async () => {
    setIsBiometricAuthenticating(true);
    try {
      const success = await authenticate();
      if (success) {
        setShowBiometricPrompt(false);
      }
      // If not successful, the BiometricPrompt component handles
      // the failure count and surfaces the fallback option.
    } finally {
      setIsBiometricAuthenticating(false);
    }
  };

  const handleBiometricFallback = () => {
    setShowBiometricPrompt(false);
  };

  if (isCheckingAuth || loading) {
    return <LoadingSpinner visible={true} />;
  }

  return (
    // Spread .panResponders (the actual gesture callbacks) not the responder object.
    <View style={{ flex: 1 }} {...panResponder.panResponders}>
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

      <BiometricPrompt
        visible={showBiometricPrompt}
        onAuthenticate={handleBiometricAuth}
        onUsePinInstead={handleBiometricFallback}
        loading={isBiometricAuthenticating}
      />
    </View>
  );
};

export default RootNavigator;// Navigation state management and inactivity handling
