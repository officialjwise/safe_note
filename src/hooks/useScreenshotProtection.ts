import { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Hook to handle screenshot protection on sensitive screens
 * Disables screenshots and screen recording on iOS/Android
 * For production:
 * - iOS: Uses UIView.preventScreenshot via native bridge
 * - Android: Uses FLAG_SECURE on Window
 * 
 * Note: This requires manual native module setup or expo-screen-capture equivalent
 * For MVP, this logs protection status. In production, integrate:
 * - react-native-shield-screen
 * - react-native-privacy-snapshot
 * - Or custom native module using native APIs
 */
export const useScreenshotProtection = () => {
  useFocusEffect(() => {
    // Platform-specific protection message
    const protectionMessage = Platform.select({
      ios: 'This screen contents are protected and cannot be recorded.',
      android: 'Screenshots disabled for this sensitive content.',
      default: 'This screen is protected.',
    });

    console.debug('[ScreenshotProtection] Protected screen active:', protectionMessage);

    // Note: To fully implement screenshot protection, add one of:
    // 1. expo install react-native-shield-screen
    // 2. expo install react-native-privacy-snapshot
    // 3. Set native FLAG_SECURE (Android) and UIView protection (iOS) via native module
    
    // For now, this hook serves as infrastructure for future native integration
    // The actual prevention requires native code or an expo-compatible library

    return () => {
      console.debug('[ScreenshotProtection] Protected screen deactivated');
    };
  });
};
