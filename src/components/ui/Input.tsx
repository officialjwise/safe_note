import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Pressable,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants';

interface InputProps extends TextInputProps {
  label?: string;
  errorMessage?: string;
  secureText?: boolean;
  showSecureToggle?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  errorMessage,
  secureText = false,
  showSecureToggle = false,
  style,
  containerStyle,
  ...textInputProps
}) => {
  const [isSecure, setIsSecure] = useState(secureText);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!errorMessage;
  const borderColor = isFocused ? COLORS.info : hasError ? COLORS.destructive : COLORS.elevatedSurface;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputWrapper}>
        <TextInput
          {...textInputProps}
          secureTextEntry={isSecure}
          style={[
            styles.input,
            {
              borderColor,
              color: COLORS.textPrimary,
              paddingRight: showSecureToggle ? 48 : SPACING.md,
            },
            style,
          ]}
          placeholderTextColor={COLORS.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {showSecureToggle && (
          <Pressable
            onPress={() => setIsSecure(!isSecure)}
            style={styles.secureToggle}
            android_ripple={{ color: 'rgba(255,255,255,0.1)', radius: 24 }}
          >
            <MaterialCommunityIcons
              name={isSecure ? 'eye-off' : 'eye'}
              size={20}
              color={COLORS.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {hasError && <Text style={styles.error}>{errorMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.body.fontSize,
    backgroundColor: COLORS.elevatedSurface,
  },
  secureToggle: {
    position: 'absolute',
    right: SPACING.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
  },
  error: {
    ...TYPOGRAPHY.caption,
    color: COLORS.destructive,
    marginTop: SPACING.sm,
  },
});

export default Input;
