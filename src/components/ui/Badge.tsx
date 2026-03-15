import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'destructive' | 'info';
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', style }) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return COLORS.success;
      case 'destructive':
        return COLORS.destructive;
      case 'info':
        return COLORS.info;
      default:
        return COLORS.elevatedSurface;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
      case 'destructive':
      case 'info':
        return COLORS.primaryBackground;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
});

export default Badge;
