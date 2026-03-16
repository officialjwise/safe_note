import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';

interface ScreenHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightIcon?: string;
  onRightIconPress?: () => void;
  subtitle?: string;
  style?: ViewStyle;
  showBackButton?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title: titleProp,
  onBackPress: onBackPressProp,
  rightIcon,
  onRightIconPress: onRightPressProp,
  subtitle,
  style: styleProp,
  showBackButton = true,
}): React.JSX.Element => {
  const title = titleProp;
  const onBackPress = onBackPressProp;
  const onRightIconPress = onRightPressProp;
  const style = styleProp;
  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftContainer}>
        {showBackButton && onBackPress && (
          <Pressable onPress={onBackPress} style={styles.backButton}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={COLORS.textPrimary}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.centerContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightContainer}>
        {rightIcon && onRightIconPress && (
          <Pressable onPress={onRightIconPress} style={styles.rightButton}>
            <MaterialCommunityIcons
              name={rightIcon as any}
              size={24}
              color={COLORS.textPrimary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PADDING.horizontal,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.primaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.elevatedSurface,
  },
  leftContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  rightContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  backButton: {
    padding: SPACING.md,
    marginLeft: -SPACING.md,
  },
  rightButton: {
    padding: SPACING.md,
    marginRight: -SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.sectionHeader,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

export default ScreenHeader;
