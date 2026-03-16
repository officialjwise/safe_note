import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input } from '@components/ui';
import { LoadingSpinner } from '@components/shared';
import { validators } from '@utils/validators';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';
import { apiClient } from '@services/apiClient';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type ForgotPasswordScreenProps = StackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }: ForgotPasswordScreenProps) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError('Email is required');
    } else if (!validators.isValidEmail(value)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text.trim()) validateEmail(text);
  };

  const handleRequestReset = async () => {
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
      const response = await apiClient.requestPasswordReset(email);
      
      if (response.error) {
        setError(response.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigation.navigate('ResetCode', { email });
        }, 2000);
      }
    } catch (err) {
      setError('Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email.trim() && !emailError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
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
            <View style={[styles.inputRow, isEmailFocused && styles.inputRowFocused, emailError && styles.inputRowError]}>
              <MaterialCommunityIcons
                name="email"
                size={18}
                color={isEmailFocused ? COLORS.accent : COLORS.textSecondary}
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
                editable={!loading}
                containerStyle={styles.inputInner}
              />
              {!emailError && email.trim() && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={COLORS.success}
                />
              )}
            </View>
            {emailError && <Text style={styles.fieldError}>{emailError}</Text>}
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.alertError}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={18}
                color={COLORS.destructive}
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
              />
              <Text style={styles.alertSuccessText}>Reset code sent! Redirecting...</Text>
            </View>
          )}

          {/* CTA */}
          <Button
            title={loading ? 'Sending...' : 'Send Reset Code'}
            onPress={handleRequestReset}
            loading={loading}
            disabled={loading || !isFormValid}
            style={[styles.cta, (!isFormValid || loading) && styles.ctaDisabled]}
          />

          {/* Back to Login Link */}
          <View style={styles.backToLoginRow}>
            <Text style={styles.backToLoginPrompt}>Remember your password?</Text>
            <Pressable onPress={() => navigation.navigate('Login')} disabled={loading}>
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
          />
          <Text style={styles.infoText}>We'll send a reset code to your email. Check spam folder if you don't see it.</Text>
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
    paddingHorizontal: PADDING.horizontal,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginBottom: SPACING.lg,
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
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.title,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text ?? COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface ?? COLORS.primaryBackground,
    borderRadius: 20,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border ?? COLORS.textMuted + '30',
    marginBottom: SPACING.lg,
  },

  // ── Field ────────────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing:0.6,
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
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.inputBackground ?? COLORS.primaryBackground,
    minHeight: 52,
    gap: SPACING.sm,
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
  },
  inputInner: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
  },
  fieldError: {
    ...TYPOGRAPHY.caption,
    color: COLORS.destructive,
    fontSize: 12,
    marginTop: SPACING.xs,
    marginLeft: 2,
  },

  // ── Alerts ────────────────────────────────────────────────────────────────
  alertError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.destructive + '12',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.destructive + '30',
    gap: SPACING.sm,
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.success + '12',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    gap: SPACING.sm,
  },
  alertText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.destructive,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  alertSuccessText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  cta: {
    marginTop: SPACING.xs,
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
    marginTop: SPACING.lg,
  },
  backToLoginPrompt: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  backToLoginLink: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
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
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
    gap: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    color: COLORS.accent,
    flex: 1,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
