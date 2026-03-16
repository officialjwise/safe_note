import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input } from '@components/ui';
import { LoadingSpinner } from '@components/shared';
import { validators } from '@utils/validators';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';
import { responsivePadding, spacing, getKeyboardOffset, responsiveFontSize } from '@utils/responsive';
import { apiClient } from '@services/apiClient';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type ForgotPasswordScreenProps = StackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }: ForgotPasswordScreenProps) => {
  const dimensions = useWindowDimensions();
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      // Cleanup any ongoing animations
    };
  }, []);

  useEffect(() => {
    if (error) {
      triggerShake();
    }
  }, [error]);

  const validateEmail = useCallback((value: string) => {
    if (!value.trim()) {
      setEmailError('Email is required');
    } else if (!validators.isValidEmail(value)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  }, []);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (emailError && text.trim()) {
      validateEmail(text);
    }
  }, [emailError, validateEmail]);

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 75, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 75, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 75, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 75, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleRequestReset = useCallback(async () => {
    Keyboard.dismiss();
    setError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validators.isValidEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.requestPasswordReset(validators.sanitizeInput(email));
      
      if (response.error) {
        setError(response.error);
      } else {
        setSuccess(true);
        // Slight delay to let user see success message
        setTimeout(() => {
          if (navigation && navigation.navigate) {
            navigation.navigate('ResetCode', { email: validators.sanitizeInput(email) });
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, navigation]);

  const isFormValid = email.trim() && !emailError && !loading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={getKeyboardOffset()}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] 
            },
          ]}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={COLORS.accent}
            />
          </Pressable>
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="lock-reset"
                size={32}
                color={COLORS.accent}
              />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>
          </View>
        </Animated.View>

        {/* Form Card */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Email Input */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, isEmailFocused && styles.fieldLabelFocused]}>
              Email Address
            </Text>
            <View style={[
              styles.inputRow, 
              isEmailFocused && styles.inputRowFocused, 
              emailError && styles.inputRowError
            ]}>
              <MaterialCommunityIcons
                name="email"
                size={18}
                color={isEmailFocused ? COLORS.accent : COLORS.textSecondary}
                style={styles.inputIcon}
              />
              <Input
                label=""
                placeholder="you@example.com"
                value={email}
                onChangeText={handleEmailChange}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => {
                  setIsEmailFocused(false);
                  if (email.trim()) validateEmail(email);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                containerStyle={styles.inputInner}
              />
              {!emailError && email.trim() && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={COLORS.success}
                  style={styles.checkIcon}
                />
              )}
            </View>
            {emailError && (
              <View style={styles.inlineError}>
                <MaterialCommunityIcons name="alert-circle" size={12} color={COLORS.destructive} />
                <Text style={styles.fieldError}>{emailError}</Text>
              </View>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View style={[styles.alertError, { transform: [{ translateX: shakeAnim }] }]}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={18}
                color={COLORS.destructive}
                style={styles.alertIcon}
              />
              <Text style={styles.alertText}>{error}</Text>
            </View>
          )}

          {/* Success Message */}
          {success && (
            <View style={styles.alertSuccess}>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={COLORS.success}
                style={styles.alertIcon}
              />
              <Text style={styles.alertSuccessText}>Reset code sent! Redirecting...</Text>
            </View>
          )}

          {/* CTA */}
          <Button
            title={loading ? 'Sending...' : 'Send Reset Code'}
            onPress={handleRequestReset}
            loading={loading}
            disabled={!isFormValid}
            style={[styles.cta, !isFormValid && styles.ctaDisabled]}
          />

          {/* Back to Login Link */}
          <View style={styles.backToLoginRow}>
            <Text style={styles.backToLoginPrompt}>Remember your password?</Text>
            <Pressable 
              onPress={() => navigation.navigate('Login')} 
              disabled={loading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.backToLoginLink, loading && styles.disabledText]}>
                {' '}Sign in
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Info Box */}
        <Animated.View style={[styles.infoBox, { opacity: fadeAnim }]}>
          <MaterialCommunityIcons
            name="information"
            size={16}
            color={COLORS.accent}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>We'll send a reset code to your email. Check your spam folder if you don't see it.</Text>
        </Animated.View>
      </ScrollView>

      <LoadingSpinner visible={loading} />
    </KeyboardAvoidingView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: responsivePadding.horizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    marginBottom: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...TYPOGRAPHY.title,
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: COLORS.text ?? COLORS.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: responsiveFontSize(14),
    color: COLORS.textSecondary,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface ?? COLORS.primaryBackground,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border ?? COLORS.textMuted + '30',
    marginBottom: spacing.lg,
  },

  // ── Field ────────────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldLabelFocused: {
    color: COLORS.accent,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border ?? COLORS.textMuted + '40',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: COLORS.inputBackground ?? COLORS.primaryBackground,
    minHeight: 52,
    gap: spacing.sm,
  },
  inputIcon: {
    marginRight: spacing.xs,
  },
  checkIcon: {
    marginLeft: spacing.xs,
  },
  inputRowFocused: {
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputRowError: {
    borderColor: COLORS.destructive,
    backgroundColor: COLORS.destructive + '05',
  },
  inputInner: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginLeft: 2,
  },
  fieldError: {
    ...TYPOGRAPHY.caption,
    color: COLORS.destructive,
    fontSize: responsiveFontSize(12),
    fontWeight: '500',
    flex: 1,
  },

  // ── Alerts ────────────────────────────────────────────────────────────────
  alertError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.destructive + '12',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.destructive + '30',
    gap: spacing.sm,
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.success + '12',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    gap: spacing.sm,
  },
  alertIcon: {
    marginTop: 2,
  },
  alertText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.destructive,
    flex: 1,
    fontSize: responsiveFontSize(13),
    fontWeight: '500',
  },
  alertSuccessText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    flex: 1,
    fontSize: responsiveFontSize(13),
    fontWeight: '500',
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  cta: {
    marginTop: spacing.md,
    borderRadius: 12,
    height: 52,
  },
  ctaDisabled: {
    opacity: 0.45,
  },

  // ── Back to Login ────────────────────────────────────────────────────────
  backToLoginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  backToLoginPrompt: {
    ...TYPOGRAPHY.body,
    fontSize: responsiveFontSize(14),
    color: COLORS.textSecondary,
  },
  backToLoginLink: {
    ...TYPOGRAPHY.body,
    fontSize: responsiveFontSize(14),
    color: COLORS.accent,
    fontWeight: '700',
  },
  disabledText: {
    opacity: 0.45,
  },

  // ── Info Box ──────────────────────────────────────────────────────────────
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.accent + '10',
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
    gap: spacing.sm,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFontSize(12),
    color: COLORS.accent,
    flex: 1,
    fontWeight: '500',
    lineHeight: 17,
  },
});

export default ForgotPasswordScreen;
