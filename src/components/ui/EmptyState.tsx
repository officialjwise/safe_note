import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants';
import Button from './Button';

interface EmptyStateProps {
  iconName: string;
  heading: string;
  subtext: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  style?: ViewStyle;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  iconName,
  heading,
  subtext,
  ctaLabel,
  onCtaPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={iconName as any}
          size={64}
          color={COLORS.textSecondary}
          style={styles.icon}
        />
        <Text style={styles.heading}>{heading}</Text>
        <Text style={styles.subtext}>{subtext}</Text>

        {ctaLabel && onCtaPress && (
          <Button
            title={ctaLabel}
            onPress={onCtaPress}
            size="small"
            style={styles.cta}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: SPACING.lg,
  },
  heading: {
    ...TYPOGRAPHY.sectionHeader,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  cta: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
});

export default EmptyState;