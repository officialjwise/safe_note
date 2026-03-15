import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { COLORS, SPACING } from '@constants';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'regular' | 'small';
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  size = 'regular',
  style,
}) => {
  const isDisabled = disabled || loading;
  const [pressed, setPressed] = useState(false);

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':    return COLORS.accent;
      case 'secondary':  return 'transparent';
      case 'destructive': return COLORS.destructive;
      default:           return COLORS.accent;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':    return COLORS.primaryBackground;
      case 'secondary':  return COLORS.accent;
      case 'destructive': return COLORS.textPrimary;
      default:           return COLORS.primaryBackground;
    }
  };

  const getBorderColor = () =>
    variant === 'secondary' ? COLORS.accent : 'transparent';

  const height = size === 'small' ? 40 : 52;
  const fontSize = size === 'small' ? 14 : 16;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      android_ripple={{ color: 'rgba(0,0,0,0.2)', radius: 12 }}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          height,
          width: fullWidth ? '100%' : 'auto',
          opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {/* Plain View child — no render prop, no collapsing height issue */}
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={getTextColor()} size={fontSize} />
        ) : (
          <Text style={[styles.text, { color: getTextColor(), fontSize }]}>
            {title}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default Button;// Button component with multiple variants
