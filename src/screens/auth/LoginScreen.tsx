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
import { useAuth } from '@hooks/useAuth';
import { Button, Input } from '@components/ui';
import { LoadingSpinner } from '@components/shared';
import { validators } from '@utils/validators';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';
import type { StackScreenProps } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

type LoginScreenProps = StackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }: LoginScreenProps) => {
  const { login, loading, error, clearErrorMessage } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Use ref so shakeAnimation is stable across renders
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Staggered fade-in animations for mount
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

    return () => {
      clearErrorMessage();
    };
  }, [clearErrorMessage]);

  useEffect(() => {
    if (error) {
      triggerShakeAnimation();
    }
  }, [error]);

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

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError('Email is required');
    } else if (!validators.isValidEmail(value)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required');
    } else if (value.length < 6) {
      setPasswordError('Minimum 6 characters');
    } else {
      setPasswordError('');
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) validateEmail(text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) validatePassword(text);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validators.isValidEmail(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      triggerShakeAnimation();
      return;
    }

    const result = await login({
      email: validators.sanitizeInput(email),
      password,
    });

    if (result.type === 'auth/login/fulfilled') {
      setLoginSuccess(true);
      setEmail('');
      setPassword('');
      setTimeout(() => setLoginSuccess(false), 2000);
    }
  };

  const isFormValid = email.trim() && password && !emailError && !passwordError;

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
          <View style={styles.logoMark}>
            <MaterialCommunityIcons
              name="lock"
              size={32}
              color={COLORS.accent}
            />
          </View>
          <Text style={styles.appName}>SecureNotes</Text>
          <Text style={styles.tagline}>Your private, encrypted workspace</Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          <Text style={styles.cardTitle}>Sign in to your account</Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, isEmailFocused && styles.fieldLabelFocused]}>
              Email address
            </Text>
            <View style={[styles.inputRow, isEmailFocused && styles.inputRowFocused, !!emailError && styles.inputRowError]}>
              <Text style={styles.fieldIcon}>✉️</Text>
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
                <Text style={styles.checkIcon}>✓</Text>
              ) : null}
            </View>
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.fieldLabel, isPasswordFocused && styles.fieldLabelFocused]}>
                Password
              </Text>
              <Pressable>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </Pressable>
            </View>
            <View style={[styles.inputRow, isPasswordFocused && styles.inputRowFocused, !!passwordError && styles.inputRowError]}>
              <Text style={styles.fieldIcon}>🔑</Text>
              <Input
                label=""
                placeholder="Enter your password"
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
                textContentType="password"
                autoComplete="password"
                editable={!loading}
                containerStyle={styles.inputInner}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </Pressable>
            </View>
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          </View>

          {/* Auth-level error */}
          {error ? (
            <View style={styles.alertError}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={18}
                color={COLORS.destructive}
              />
              <Text style={styles.alertText}>{error}</Text>
            </View>
          ) : null}

          {/* Success */}
          {loginSuccess ? (
            <View style={styles.alertSuccess}>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={COLORS.success}
              />
              <Text style={styles.alertSuccessText}>Signed in successfully!</Text>
            </View>
          ) : null}

          {/* CTA */}
          <Button
            title={loading ? 'Signing in…' : 'Sign In'}
            onPress={handleLogin}
            loading={loading}
            disabled={loading || !isFormValid}
            style={[styles.cta, (!isFormValid || loading) && styles.ctaDisabled]}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Forgot Password */}
          <Pressable
            style={styles.forgotPasswordLink}
            onPress={() => navigation.navigate('ForgotPassword')}
            disabled={loading}
          >
            <Text style={[styles.forgotPasswordText, loading && styles.disabledText]}>
              Forgot password?
            </Text>
          </Pressable>

          {/* Sign up */}
          <View style={styles.signupRow}>
            <Text style={styles.signupPrompt}>Don't have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Register')} disabled={loading}>
              <Text style={[styles.signupLink, loading && styles.disabledText]}>
                {' '}Create one
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Trust badge */}
        <Animated.View style={[styles.trustBadge, { opacity: fadeAnim }]}>
          <MaterialCommunityIcons
            name="shield-check"
            size={16}
            color={COLORS.accent}
          />
          <Text style={styles.trustText}>256-bit AES · Zero-knowledge · End-to-end encrypted</Text>
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
    paddingTop: SPACING.xxl ?? 48,
    paddingBottom: SPACING.xl,
    justifyContent: 'center',
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 30,
  },
  appName: {
    ...TYPOGRAPHY.title,
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text ?? COLORS.accent,
    letterSpacing: -0.5,
  },
  tagline: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontSize: 13,
  },

  // ── Card ─────────────────────────────────────────────────────────────────
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
  cardTitle: {
    ...TYPOGRAPHY.subtitle ?? TYPOGRAPHY.body,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text ?? COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },

  // ── Field ─────────────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
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
  forgotLink: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
  forgotPasswordLink: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
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

  // ── CTA ───────────────────────────────────────────────────────────────────
  cta: {
    marginTop: SPACING.xs,
    borderRadius: 12,
    height: 52,
  },
  ctaDisabled: {
    opacity: 0.45,
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border ?? COLORS.textMuted + '30',
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: SPACING.md,
    letterSpacing: 1,
  },

  // ── Sign up row ───────────────────────────────────────────────────────────
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupPrompt: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signupLink: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '700',
  },
  disabledText: {
    opacity: 0.45,
  },

  // ── Trust badge ───────────────────────────────────────────────────────────
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  trustText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default LoginScreen;