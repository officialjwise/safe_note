import { Dimensions, Platform } from 'react-native';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

// Device type detection
export const deviceType = {
  isLargeDevice: windowWidth > 768,
  isTablet: windowWidth > 600,
  isSmallDevice: windowWidth < 375,
  isLandscape: windowWidth > windowHeight,
};

// Responsive scaling
export const responsiveSize = (baseSize: number): number => {
  const scalingFactor = windowWidth / 375; // Base design width is 375px (iPhone SE)
  return Math.round(baseSize * scalingFactor);
};

// Font size scaler
export const responsiveFontSize = (baseSize: number): number => {
  const scalingFactor = Math.min(windowWidth / 375, 1.3); // Max 30% scaling
  return Math.round(baseSize * scalingFactor);
};

// Padding scaler
export const responsivePadding = {
  horizontal: responsiveSize(deviceType.isSmallDevice ? 12 : 16),
  vertical: responsiveSize(deviceType.isSmallDevice ? 12 : 16),
  sm: responsiveSize(8),
  md: responsiveSize(12),
  lg: responsiveSize(16),
  xl: responsiveSize(24),
};

// Spacing adjustments for different screens
export const spacing = {
  tiny: responsiveSize(4),
  xs: responsiveSize(8),
  sm: responsiveSize(12),
  md: responsiveSize(16),
  lg: responsiveSize(24),
  xl: responsiveSize(32),
  xxl: responsiveSize(48),
};

// Max content width for tablets
export const maxContentWidth = deviceType.isLargeDevice ? 600 : windowWidth - spacing.md * 2;

// Get keyboard offset based on device
export const getKeyboardOffset = (): number => {
  if (Platform.OS === 'ios') {
    return deviceType.isSmallDevice ? 0 : 24;
  }
  return 0; // Android handles this automatically
};

// Get input height based on screen size
export const getInputHeight = (): number => {
  return responsiveSize(deviceType.isSmallDevice ? 44 : 52);
};

// Get button height based on screen size
export const getButtonHeight = (): number => {
  return responsiveSize(deviceType.isSmallDevice ? 44 : 52);
};

// Touchable hit slop for better UX on small devices
export const getTouchableHitSlop = () => ({
  top: Math.max(8, responsiveSize(8)),
  bottom: Math.max(8, responsiveSize(8)),
  left: Math.max(8, responsiveSize(8)),
  right: Math.max(8, responsiveSize(8)),
});

export default {
  deviceType,
  responsiveSize,
  responsiveFontSize,
  responsivePadding,
  spacing,
  maxContentWidth,
  getKeyboardOffset,
  getInputHeight,
  getButtonHeight,
  getTouchableHitSlop,
};
