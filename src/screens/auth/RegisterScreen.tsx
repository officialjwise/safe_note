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
  Dimensions,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuth } from '@hooks/useAuth';
import { Button, Input } from '@components/ui';
import { LoadingSpinner } from '@components/shared';
import { validators } from '@utils/validators';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';
import { responsivePadding, spacing, getKeyboardOffset, responsiveFontSize } from '@utils/responsive';
import type { StackScreenProps } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
};

type RegisterScreenProps = StackScreenProps<RootStackParamList, 'Register'>;

// ── Helper sub-components ──────────────────────────────────────────────────────

const Requirement: React.FC<{ text: string; met: boolean }> = ({ text, met }) => (
  <View style={styles.requirementItem}>
    <Icon
      name={met ? 'check' : 'circle'}
      size={13}
      color={met ? COLORS.success : COLORS.textMuted}
      style={styles.requirementIcon}
    />
    <Text style={[styles.requirementText, { color: met ? COLORS.success : COLORS.textMuted }]}>
      {text}
    </Text>
  </View>
);

// ── Screen ─────────────────────────────────────────────────────────────────────

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }: RegisterScreenProps) => {
  const { register, loading, error, clearErrorMessage } = useAuth();
  const dimensions = useWindowDimensions();
  const isSmallDevice = dimensions.width < 375;

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

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const strengthAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    return () => { clearErrorMessage(); };
  }, [clearErrorMessage]);

  useEffect(() => {
    if (error) triggerShakeAnimation();
  }, [error]);

  useEffect(() => {
    if (password) {
      const strength = validators.getPasswordStrength(password);
      setPasswordStrength(strength);
      const target = strength === 'strong' ? 1 : strength === 'medium' ? 0.5 : 0.2;
      Animated.timing(strengthAnimation, {
        toValue: target,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    } else {
      strengthAnimation.setValue(0);
      setPasswordStrength('weak');
    }
  }, [password]);

  const triggerShakeAnimation = useCallback(() => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 6, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -6, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 80, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [shakeAnimation]);

  // ── Validators ──────────────────────────────────────────────────────────────

  const validateEmail = useCallback((value: string) => {
    if (!value.trim()) setEmailError('Email is required');
    else if (!validators.isValidEmail(value)) setEmailError('Invalid email format');
    else setEmailError('');
  }, []);

  const validatePassword = useCallback((value: string) => {
    if (!value) setPasswordError('Password is required');
    else if (!validators.isPasswordValid(value))
      setPasswordError('Needs 8+ chars, uppercase, number & special character');
    else setPasswordError('');
  }, []);

  const validateConfirmPassword = useCallback((value: string) => {
    if (!value) setConfirmPasswordError('Please confirm your password');
    else if (!validators.doPasswordsMatch(password, value))
      setConfirmPasswordError('Passwords do not match');
    else setConfirmPasswordError('');
  }, [password]);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (emailError) validateEmail(text);
  }, [emailError, validateEmail]);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (passwordError) validatePassword(text);
    if (confirmPassword && confirmPasswordError) validateConfirmPassword(confirmPassword);
  }, [passwordError, confirmPassword, confirmPasswordError, validatePassword, validateConfirmPassword]);

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) validateConfirmPassword(text);
  }, [confirmPasswordError, validateConfirmPassword]);

  const validateForm = useCallback((): boolean => {
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
  }, [email, password, confirmPassword]);

  const handleRegister = useCallback(async () => {
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
  }, [validateForm, triggerShakeAnimation, register, email, password, confirmPassword, navigation]);

  // ── Strength helpers ────────────────────────────────────────────────────────

  const strengthColor =
    passwordStrength === 'strong' ? COLORS.success :
    passwordStrength === 'medium' ? '#F59E0B' :
    COLORS.destructive;

  const strengthLabel =
    passwordStrength === 'strong' ? 'Strong' :
    passwordStrength === 'medium' ? 'Medium' : 'Weak';

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
        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.header,
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }, { translateX: shakeAnimation }] 
            },
          ]}
        >
          <Pressable onPress={() => navigation.goBack()} disabled={loading}>
            <Icon name="arrow-left" size={24} color={COLORS.accent} />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Secure your notes end-to-end</Text>
          </View>
        </Animated.View>

        {/* ── Form Card ── */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, isEmailFocused && styles.fieldLabelFocused]}>
              Email
            </Text>
            <View style={[
              styles.inputRow,
              isEmailFocused && styles.inputRowFocused,
              !!emailError && styles.inputRowError,
            ]}>
              <Icon
                name="mail"
                size={16}
                color={isEmailFocused ? COLORS.accent : COLORS.textMuted}
                style={styles.inputLeadIcon}
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
              {!emailError && email.trim() ? (
                <Icon name="check" size={16} color={COLORS.success} style={styles.inputTrailIcon} />
              ) : null}
            </View>
            {emailError ? (
              <View style={styles.inlineError}>
                <Icon name="alert-circle" size={12} color={COLORS.destructive} />
                <Text style={styles.fieldError}>{emailError}</Text>
              </View>
            ) : null}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, isPasswordFocused && styles.fieldLabelFocused]}>
              Password
            </Text>
            <View style={[
              styles.inputRow,
              isPasswordFocused && styles.inputRowFocused,
              !!passwordError && styles.inputRowError,
            ]}>
              <Icon
                name="lock"
                size={16}
                color={isPasswordFocused ? COLORS.accent : COLORS.textMuted}
                style={styles.inputLeadIcon}
              />
              <Input
                label=""
                placeholder="Create a strong password"
                value={password}
                onChangeText={handlePasswordChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => {
                  setIsPasswordFocused(false);
                  if (password) validatePassword(password);
                }}
                secureText={!showPassword}
                showSecureToggle={false}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="password-new"
                editable={!loading}
                containerStyle={styles.inputInner}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={16} color={COLORS.textMuted} />
              </Pressable>
            </View>
            {passwordError ? (
              <View style={styles.inlineError}>
                <Icon name="alert-circle" size={12} color={COLORS.destructive} />
                <Text style={styles.fieldError}>{passwordError}</Text>
              </View>
            ) : null}

            {/* Strength indicator */}
            {password ? (
              <View style={styles.strengthBlock}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthLabel}>Password Strength</Text>
                  <Text style={[styles.strengthValue, { color: strengthColor }]}>{strengthLabel}</Text>
                </View>
                <View style={styles.strengthTrack}>
                  <Animated.View
                    style={[
                      styles.strengthFill,
                      { width: strengthBarWidth, backgroundColor: strengthColor },
                    ]}
                  />
                </View>
              </View>
            ) : null}

            {/* Requirements */}
            <View style={styles.requirementsBox}>
              <Requirement text="At least 8 characters" met={password.length >= 8} />
              <Requirement text="Uppercase letter" met={/[A-Z]/.test(password)} />
              <Requirement text="Number (0-9)" met={/[0-9]/.test(password)} />
              <Requirement text="Special character" met={/[!@#$%^&*]/.test(password)} />
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, isConfirmFocused && styles.fieldLabelFocused]}>
              Confirm Password
            </Text>
            <View style={[
              styles.inputRow,
              isConfirmFocused && styles.inputRowFocused,
              !!confirmPasswordError && styles.inputRowError,
            ]}>
              <Icon
                name="lock"
                size={16}
                color={isConfirmFocused ? COLORS.accent : COLORS.textMuted}
                style={styles.inputLeadIcon}
              />
              <Input
                label=""
                placeholder="Confirm your password"
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
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={16} color={COLORS.textMuted} />
              </Pressable>
              {!confirmPasswordError && confirmPassword ? (
                <Icon name="check" size={16} color={COLORS.success} style={styles.inputTrailIcon} />
              ) : null}
            </View>
            {confirmPasswordError ? (
              <View style={styles.inlineError}>
                <Icon name="alert-circle" size={12} color={COLORS.destructive} />
                <Text style={styles.fieldError}>{confirmPasswordError}</Text>
              </View>
            ) : null}
          </View>

          {/* Auth-level error */}
          {error ? (
            <View style={styles.alertError}>
              <Icon name="alert-triangle" size={15} color={COLORS.destructive} style={styles.alertLeadIcon} />
              <Text style={styles.alertErrorText}>{error}</Text>
            </View>
          ) : null}

          {/* Success */}
          {registerSuccess ? (
            <View style={styles.alertSuccess}>
              <Icon name="check-circle" size={15} color={COLORS.success} style={styles.alertLeadIcon} />
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
            By creating an account, you agree to our{' '}
            <Text style={styles.privacyLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.privacyLink}>Privacy Policy</Text>.
            {' '}Your data is always encrypted.
          </Text>
        </Animated.View>

        {/* ── Footer ── */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Text style={styles.footerPrompt}>Already have an account?</Text>
          <Pressable onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={[styles.footerLink, loading && styles.disabledText]}> Sign In</Text>
          </Pressable>
        </Animated.View>

        {/* Trust badge */}
        <Animated.View style={[styles.trustBadge, { opacity: fadeAnim }]}>
          <Icon name="shield" size={11} color={COLORS.textMuted} style={styles.trustIcon} />
          <Text style={styles.trustText}>256-bit AES · Zero-knowledge · End-to-end encrypted</Text>
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
    paddingHorizontal: responsivePadding.horizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.title,
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: COLORS.text ?? COLORS.textSecondary,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 3,
    fontSize: responsiveFontSize(13),
  },

  // ── Card ────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface ?? COLORS.primaryBackground,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border ?? COLORS.textMuted + '25',
    marginBottom: spacing.lg,
  },

  // ── Field ────────────────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFontSize(11),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  fieldLabelFocused: {
    color: COLORS.accent,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border ?? COLORS.textMuted + '35',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: COLORS.inputBackground ?? COLORS.primaryBackground,
    minHeight: 52,
    gap: spacing.xs,
  },
  inputRowFocused: {
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  inputRowError: {
    borderColor: COLORS.destructive,
    backgroundColor: COLORS.destructive + '05',
  },
  inputLeadIcon: {
    marginRight: spacing.xs,
  },
  inputInner: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  inputTrailIcon: {
    marginLeft: spacing.xs,
  },
  eyeButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
    marginLeft: 2,
  },
  fieldError: {
    ...TYPOGRAPHY.caption,
    color: COLORS.destructive,
    fontSize: responsiveFontSize(12),
  },

  // ── Strength ─────────────────────────────────────────────────────────────────
  strengthBlock: {
    marginTop: spacing.md,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  strengthLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFontSize(11),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  strengthValue: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFontSize(11),
    fontWeight: '700',
  },
  strengthTrack: {
    height: 4,
    backgroundColor: COLORS.textMuted + '20',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ── Requirements ──────────────────────────────────────────────────────────────
  requirementsBox: {
    backgroundColor: COLORS.textMuted + '08',
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementIcon: {
    marginRight: 8,
    width: 14,
  },
  requirementText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFontSize(12),
    flex: 1,
  },

  // ── Alerts ───────────────────────────────────────────────────────────────────
  alertError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.destructive + '10',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.destructive + '25',
    gap: 10,
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.success + '10',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.success + '25',
    gap: 10,
  },
  alertLeadIcon: {
    marginTop: 1,
  },
  alertErrorText: {
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

  // ── CTA ───────────────────────────────────────────────────────────────────────
  cta: {
    borderRadius: 12,
    height: 52,
    marginTop: spacing.xs,
  },
  ctaDisabled: {
    opacity: 0.45,
  },

  // ── Privacy notice ────────────────────────────────────────────────────────────
  privacyNotice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: responsiveFontSize(11),
    lineHeight: 17,
  },
  privacyLink: {
    color: COLORS.accent,
    fontWeight: '600',
  },

  // ── Footer ────────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footerPrompt: {
    ...TYPOGRAPHY.body,
    fontSize: responsiveFontSize(14),
    color: COLORS.textSecondary,
  },
  footerLink: {
    ...TYPOGRAPHY.body,
    fontSize: responsiveFontSize(14),
    color: COLORS.accent,
    fontWeight: '700',
  },
  disabledText: {
    opacity: 0.45,
  },

  // ── Trust badge ───────────────────────────────────────────────────────────────
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.md,
  },
  trustIcon: {
    marginRight: 5,
  },
  trustText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFontSize(11),
    color: COLORS.textMuted,
    letterSpacing: 0.2,
  },
});

export default RegisterScreen;

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

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const strengthAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    return () => { clearErrorMessage(); };
  }, [clearErrorMessage]);

  useEffect(() => {
    if (error) triggerShakeAnimation();
  }, [error]);

  useEffect(() => {
    if (password) {
      const strength = validators.getPasswordStrength(password);
      setPasswordStrength(strength);
      const target = strength === 'strong' ? 1 : strength === 'medium' ? 0.5 : 0.2;
      Animated.timing(strengthAnimation, {
        toValue: target,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    } else {
      strengthAnimation.setValue(0);
      setPasswordStrength('weak');
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
    passwordStrength === 'strong' ? COLORS.success :
    passwordStrength === 'medium' ? '#F59E0B' :
    COLORS.destructive;

  const strengthLabel =
    passwordStrength === 'strong' ? 'Strong' :
    passwordStrength === 'medium' ? 'Medium' : 'Weak';

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
        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="arrow-left" size={20} color={COLORS.text ?? COLORS.textSecondary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Secure your notes today</Text>
          </View>
        </Animated.View>

        {/* ── Form Card ── */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, isEmailFocused && styles.fieldLabelFocused]}>
              Email Address
            </Text>
            <View style={[
              styles.inputRow,
              isEmailFocused && styles.inputRowFocused,
              !!emailError && styles.inputRowError,
            ]}>
              <Icon
                name="mail"
                size={16}
                color={isEmailFocused ? COLORS.accent : COLORS.textMuted}
                style={styles.inputLeadIcon}
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
              {!emailError && email.trim() ? (
                <Icon name="check" size={16} color={COLORS.success} style={styles.inputTrailIcon} />
              ) : null}
            </View>
            {emailError ? (
              <View style={styles.inlineError}>
                <Icon name="alert-circle" size={12} color={COLORS.destructive} />
                <Text style={styles.fieldError}>{emailError}</Text>
              </View>
            ) : null}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, isPasswordFocused && styles.fieldLabelFocused]}>
              Password
            </Text>
            <View style={[
              styles.inputRow,
              isPasswordFocused && styles.inputRowFocused,
              !!passwordError && styles.inputRowError,
            ]}>
              <Icon
                name="lock"
                size={16}
                color={isPasswordFocused ? COLORS.accent : COLORS.textMuted}
                style={styles.inputLeadIcon}
              />
              <Input
                label=""
                placeholder="Create a strong password"
                value={password}
                onChangeText={handlePasswordChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => {
                  setIsPasswordFocused(false);
                  if (password) validatePassword(password);
                }}
                secureText={!showPassword}
                showSecureToggle={false}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="password-new"
                editable={!loading}
                containerStyle={styles.inputInner}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={16} color={COLORS.textMuted} />
              </Pressable>
            </View>
            {passwordError ? (
              <View style={styles.inlineError}>
                <Icon name="alert-circle" size={12} color={COLORS.destructive} />
                <Text style={styles.fieldError}>{passwordError}</Text>
              </View>
            ) : null}

            {/* Strength meter */}
            {password ? (
              <View style={styles.strengthBlock}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthLabel}>Password strength</Text>
                  <Text style={[styles.strengthValue, { color: strengthColor }]}>
                    {strengthLabel}
                  </Text>
                </View>
                <View style={styles.strengthTrack}>
                  <Animated.View
                    style={[
                      styles.strengthFill,
                      { width: strengthBarWidth, backgroundColor: strengthColor },
                    ]}
                  />
                </View>
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
              Confirm Password
            </Text>
            <View style={[
              styles.inputRow,
              isConfirmFocused && styles.inputRowFocused,
              !!confirmPasswordError && styles.inputRowError,
            ]}>
              <Icon
                name="shield"
                size={16}
                color={isConfirmFocused ? COLORS.accent : COLORS.textMuted}
                style={styles.inputLeadIcon}
              />
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
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={16} color={COLORS.textMuted} />
              </Pressable>
              {!confirmPasswordError && confirmPassword ? (
                <Icon name="check" size={16} color={COLORS.success} style={styles.inputTrailIcon} />
              ) : null}
            </View>
            {confirmPasswordError ? (
              <View style={styles.inlineError}>
                <Icon name="alert-circle" size={12} color={COLORS.destructive} />
                <Text style={styles.fieldError}>{confirmPasswordError}</Text>
              </View>
            ) : null}
          </View>

          {/* Auth-level error */}
          {error ? (
            <View style={styles.alertError}>
              <Icon name="alert-triangle" size={15} color={COLORS.destructive} style={styles.alertLeadIcon} />
              <Text style={styles.alertErrorText}>{error}</Text>
            </View>
          ) : null}

          {/* Success */}
          {registerSuccess ? (
            <View style={styles.alertSuccess}>
              <Icon name="check-circle" size={15} color={COLORS.success} style={styles.alertLeadIcon} />
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
            By creating an account, you agree to our{' '}
            <Text style={styles.privacyLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.privacyLink}>Privacy Policy</Text>.
            {' '}Your data is always encrypted.
          </Text>
        </Animated.View>

        {/* ── Footer ── */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Text style={styles.footerPrompt}>Already have an account?</Text>
          <Pressable onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={[styles.footerLink, loading && styles.disabledText]}> Sign In</Text>
          </Pressable>
        </Animated.View>

        {/* Trust badge */}
        <Animated.View style={[styles.trustBadge, { opacity: fadeAnim }]}>
          <Icon name="shield" size={11} color={COLORS.textMuted} style={styles.trustIcon} />
          <Text style={styles.trustText}>256-bit AES · Zero-knowledge · End-to-end encrypted</Text>
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
    paddingTop: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surface ?? COLORS.textMuted + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
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
    marginTop: 3,
    fontSize: 13,
  },

  // ── Card ────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface ?? COLORS.primaryBackground,
    borderRadius: 20,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border ?? COLORS.textMuted + '25',
    marginBottom: SPACING.xl,
  },

  // ── Field ────────────────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  fieldLabelFocused: {
    color: COLORS.accent,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border ?? COLORS.textMuted + '35',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.inputBackground ?? COLORS.primaryBackground,
    height: 52,
  },
  inputRowFocused: {
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  inputRowError: {
    borderColor: COLORS.destructive,
    backgroundColor: COLORS.destructive + '05',
  },
  inputLeadIcon: {
    marginRight: 10,
  },
  inputInner: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  inputTrailIcon: {
    marginLeft: 8,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 6,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
    marginLeft: 2,
  },
  fieldError: {
    ...TYPOGRAPHY.caption,
    color: COLORS.destructive,
    fontSize: 12,
  },

  // ── Strength ─────────────────────────────────────────────────────────────────
  strengthBlock: {
    marginTop: SPACING.md,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  strengthLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  strengthValue: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  strengthTrack: {
    height: 4,
    backgroundColor: COLORS.textMuted + '20',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ── Requirements ──────────────────────────────────────────────────────────────
  requirementsBox: {
    backgroundColor: COLORS.textMuted + '08',
    borderRadius: 10,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementIcon: {
    marginRight: 8,
    width: 14,
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
    backgroundColor: COLORS.destructive + '10',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.destructive + '25',
    gap: 10,
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.success + '10',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.success + '25',
    gap: 10,
  },
  alertLeadIcon: {
    marginTop: 1,
  },
  alertErrorText: {
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
    marginTop: SPACING.xs,
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
  privacyLink: {
    color: COLORS.accent,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.md,
  },
  trustIcon: {
    marginRight: 5,
  },
  trustText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.2,
  },
});

export default RegisterScreen;