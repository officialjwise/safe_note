export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const PADDING = {
  horizontal: SPACING.xl, // 20px
  vertical: SPACING.lg,    // 16px
} as const;
