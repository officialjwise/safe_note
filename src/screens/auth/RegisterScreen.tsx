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
import { useAuth } from '@hooks/useAuth';
import { Button, Input } from '@components/ui';
import { LoadingSpinner } from '@components/shared';
import { validators } from '@utils/validators';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';
import type { StackScreenProps } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
};

type RegisterScreenProps = StackScreenProps<RootStackParamList, 'Register'>;

// ── Helper sub-components ──────────────────────────────────────────────────────

const Requirement: React.FC<{ text: string; met: boolean }> = ({ text, met }) => (
  <View style={styles.requirementItem}>
    <Text style={[styles.requirementDot, { color: met ? COLORS.success : COLORS.textMuted }]}>
      {met ? '✓' : '○'}
    </Text>
    <Text style={[styles.requirementText, { color: met ? COLORS.success : COLORS.textMuted }]}>
      {text}
    </Text>
  </View>
);

// ── Screen ─────────────────────────────────────────────────────────────────────

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }: RegisterScreenProps) => {
  const { register, loading, error, clearErrorMessage } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Stable animated refs
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const strengthAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  // Mount animation
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

    return () => {
      clearErrorMessage();
    };
  }, [clearErrorMessage]);

  useEffect(() => {
    if (error) triggerShakeAnimation();
  }, [error]);

  useEffect(() => {
    if (password) {
      const strength = validators.getPasswordStrength(password);
      setPasswordStrength(strength);
      const targetValue = strength === 'strong' ? 1 : strength === 'medium' ? 0.5 : 0.2;
      Animated.timing(strengthAnimation, {
        toValue: targetValue,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    } else {
      strengthAnimation.setValue(0);
    }
  }, [password]);

  const triggerShakeAnimation = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 6, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -6, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 80, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  };

  // ── Validators ──────────────────────────────────────────────────────────────

  const validateEmail = (value: string) => {
    if (!value.trim()) setEmailError('Email is required');
    else if (!validators.isValidEmail(value)) setEmailError('Invalid email format');
    else setEmailError('');
  };

  const validatePassword = (value: string) => {
    if (!value) setPasswordError('Password is required');
    else if (!validators.isPasswordValid(value))
      setPasswordError('Needs 8+ chars, uppercase, number & special character');
    else setPasswordError('');
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) setConfirmPasswordError('Please confirm your password');
    else if (!validators.doPasswordsMatch(password, value))
      setConfirmPasswordError('Passwords do not match');
    else setConfirmPasswordError('');
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) validateEmail(text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) validatePassword(text);
    // Re-validate confirm if already filled
    if (confirmPassword && confirmPasswordError) validateConfirmPassword(confirmPassword);
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) validateConfirmPassword(text);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!email.trim()) { setEmailError('Email is required'); isValid = false; }
    else if (!validators.isValidEmail(email)) { setEmailError('Please enter a valid email'); isValid = false; }

    if (!password) { setPasswordError('Password is required'); isValid = false; }
    else if (!validators.isPasswordValid(password)) {
      setPasswordError('Password must be 8+ chars with uppercase, number & special character');
      isValid = false;
    }

    if (!confirmPassword) { setConfirmPasswordError('Please confirm your password'); isValid = false; }
    else if (!validators.doPasswordsMatch(password, confirmPassword)) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      triggerShakeAnimation();
      return;
    }

    const result = await register({
      email: validators.sanitizeInput(email),
      password,
    });

    if (result.type === 'auth/register/fulfilled') {
      setRegisterSuccess(true);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setRegisterSuccess(false);
        navigation.navigate('Login');
      }, 1800);
    }
  };

  // ── Strength helpers ────────────────────────────────────────────────────────

  const strengthColor =
    passwordStrength === 'strong'
      ? COLORS.success
      : passwordStrength === 'medium'
      ? '#F59E0B'
      : COLORS.destructive;

  const strengthLabel =
    passwordStrength === 'strong'
      ? 'Strong'
      : passwordStrength === 'medium'
      ? 'Medium'
      : 'Weak';

  const strengthBarWidth = strengthAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isFormValid =
    email.trim() &&
    password &&
    confirmPassword &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    passwordStrength === 'strong';

  // ── Render ─────────────────────────────────────────────────────────────────

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
          style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Secure your notes today</Text>
          </View>
        </Animated.View>

        {/* Form Card */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, isEmailFocused && styles.fieldLabelFocused]}>
              Email address
            </Text>
            <View
              style={[
                styles.inputRow,
                isEmailFocused && styles.inputRowFocused,
                !!emailError && styles.inputRowError,
              ]}
            >
              <Text style={styles.fieldIcon}>✉️</Text>
              <Input
                label=""
                placeholder="you@example.com"
                value={email}
                onChangeText={handleEmailChange}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => { setIsEmailFocused(false); if (email.trim()) validateEmail(email); }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                containerStyle={styles.inputInner}
              />
              {!emailError && email.trim() ? (
                <Text style={styles.checkIcon}>✓</Text>
              ) : null}
            </View>
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, isPasswordFocused && styles.fieldLabelFocused]}>
              Password
            </Text>
            <View
              style={[
                styles.inputRow,
                isPasswordFocused && styles.inputRowFocused,
                !!passwordError && styles.inputRowError,
              ]}
            >
              <Text style={styles.fieldIcon}>🔑</Text>
              <Input
                label=""
                placeholder="Create a strong password"
                value={password}
                onChangeText={handlePasswordChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => { setIsPasswordFocused(false); if (password) validatePassword(password); }}
                secureText={!showPassword}
                showSecureToggle={false}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="password-new"
                editable={!loading}
                containerStyle={styles.inputInner}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

            {/* Strength meter */}
            {password ? (
              <View style={styles.strengthBlock}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthLabel}>Password strength</Text>
                  <Text style={[styles.strengthValue, { color: strengthColor }]}>{strengthLabel}</Text>
                </View>
                <View style={styles.strengthTrack}>
                  <Animated.View
                    style={[styles.strengthFill, { width: strengthBarWidth, backgroundColor: strengthColor }]}
                  />
                </View>

                {/* Requirements checklist */}
                <View style={styles.requirementsBox}>
                  <Requirement text="At least 8 characters" met={password.length >= 8} />
                  <Requirement text="Contains uppercase letter" met={/[A-Z]/.test(password)} />
                  <Requirement text="Contains a number" met={/\d/.test(password)} />
                  <Requirement
                    text="Contains special character"
                    met={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)}
                  />
                </View>
              </View>
            ) : null}
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, isConfirmFocused && styles.fieldLabelFocused]}>
              Confirm password
            </Text>
            <View
              style={[
                styles.inputRow,
                isConfirmFocused && styles.inputRowFocused,
                !!confirmPasswordError && styles.inputRowError,
              ]}
            >
              <Text style={styles.fieldIcon}>🔒</Text>
              <Input
                label=""
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                onFocus={() => setIsConfirmFocused(true)}
                onBlur={() => {
                  setIsConfirmFocused(false);
                  if (confirmPassword) validateConfirmPassword(confirmPassword);
                }}
                secureText={!showConfirmPassword}
                showSecureToggle={false}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                autoComplete="password"
                editable={!loading}
                containerStyle={styles.inputInner}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
              </Pressable>
              {!confirmPasswordError && confirmPassword ? (
                <Text style={styles.checkIcon}>✓</Text>
              ) : null}
            </View>
            {confirmPasswordError ? (
              <Text style={styles.fieldError}>{confirmPasswordError}</Text>
            ) : null}
          </View>

          {/* Auth-level error */}
          {error ? (
            <View style={styles.alertError}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <Text style={styles.alertText}>{error}</Text>
            </View>
          ) : null}

          {/* Success */}
          {registerSuccess ? (
            <View style={styles.alertSuccess}>
              <Text style={styles.alertIcon}>✅</Text>
              <Text style={styles.alertSuccessText}>Account created! Redirecting…</Text>
            </View>
          ) : null}

          {/* CTA */}
          <Button
            title={loading ? 'Creating account…' : 'Create Account'}
            onPress={handleRegister}
            loading={loading}
            disabled={loading || !isFormValid}
            style={[styles.cta, (!isFormValid || loading) && styles.ctaDisabled]}
          />

          {/* Privacy notice */}
          <Text style={styles.privacyNotice}>
            By creating an account, you agree to our Terms of Service and Privacy Policy. Your data is always encrypted.
          </Text>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Text style={styles.footerPrompt}>Already have an account?</Text>
          <Pressable onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={[styles.footerLink, loading && styles.disabledText]}> Sign In</Text>
          </Pressable>
        </Animated.View>

        {/* Trust badge */}
        <Animated.View style={[styles.trustBadge, { opacity: fadeAnim }]}>
          <Text style={styles.trustText}>🛡️ 256-bit AES · Zero-knowledge · End-to-end encrypted</Text>
        </Animated.View>
      </ScrollView>

      <LoadingSpinner visible={loading} />
    </KeyboardAvoidingView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

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

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  backIcon: {
    fontSize: 22,
    color: COLORS.text ?? COLORS.textSecondary,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.title,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text ?? COLORS.textSecondary,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontSize: 13,
  },

  // ── Card ────────────────────────────────────────────────────────────────────
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

  // ── Field ────────────────────────────────────────────────────────────────────
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
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.inputBackground ?? COLORS.primaryBackground,
    minHeight: 52,
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
  fieldIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  inputInner: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
  },
  checkIcon: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '700',
    marginLeft: SPACING.xs,
  },
  eyeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  eyeIcon: {
    fontSize: 16,
  },
  fieldError: {
    ...TYPOGRAPHY.caption,
    color: COLORS.destructive,
    fontSize: 12,
    marginTop: SPACING.xs,
    marginLeft: 2,
  },

  // ── Strength ─────────────────────────────────────────────────────────────────
  strengthBlock: {
    marginTop: SPACING.md,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  strengthLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  strengthValue: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  strengthTrack: {
    height: 5,
    backgroundColor: COLORS.textMuted + '25',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },

  // ── Requirements ──────────────────────────────────────────────────────────────
  requirementsBox: {
    backgroundColor: COLORS.textMuted + '08',
    borderRadius: 10,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  requirementDot: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: SPACING.sm,
    width: 16,
    textAlign: 'center',
  },
  requirementText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    flex: 1,
  },

  // ── Alerts ───────────────────────────────────────────────────────────────────
  alertError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.destructive + '12',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.destructive + '30',
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
  },
  alertIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
    marginTop: 1,
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

  // ── CTA ───────────────────────────────────────────────────────────────────────
  cta: {
    borderRadius: 12,
    height: 52,
  },
  ctaDisabled: {
    opacity: 0.45,
  },

  // ── Privacy notice ────────────────────────────────────────────────────────────
  privacyNotice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.lg,
    fontSize: 11,
    lineHeight: 17,
  },

  // ── Footer ────────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  footerPrompt: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footerLink: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '700',
  },
  disabledText: {
    opacity: 0.45,
  },

  // ── Trust badge ───────────────────────────────────────────────────────────────
  trustBadge: {
    alignItems: 'center',
    paddingBottom: SPACING.md,
  },
  trustText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default RegisterScreen;