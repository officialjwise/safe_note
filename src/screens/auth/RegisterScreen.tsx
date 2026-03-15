import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { Button, Input, Badge } from '@components/ui';
import { LoadingSpinner } from '@components/shared';
import { validators } from '@utils/validators';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';
import type { StackScreenProps } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
};

type RegisterScreenProps = StackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }: RegisterScreenProps) => {
  const { register, loading, error, clearErrorMessage } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  useEffect(() => {
    return () => {
      clearErrorMessage();
    };
  }, [clearErrorMessage]);

  useEffect(() => {
    if (password) {
      setPasswordStrength(validators.getPasswordStrength(password));
    }
  }, [password]);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

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
    } else if (!validators.isPasswordValid(password)) {
      setPasswordError(
        'Password must be at least 8 characters with uppercase, number, and special character'
      );
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (!validators.doPasswordsMatch(password, confirmPassword)) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      return;
    }

    const result = await register({
      email: validators.sanitizeInput(email),
      password,
    });

    if (result.type === 'auth/register/fulfilled') {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return COLORS.destructive;
      case 'medium':
        return '#F59E0B';
      case 'strong':
        return COLORS.success;
      default:
        return COLORS.textMuted;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.title}>Create Account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            errorMessage={emailError}
            containerStyle={styles.inputContainer}
          />

          <View style={styles.passwordContainer}>
            <Input
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={setPassword}
              secureText
              showSecureToggle
              editable={!loading}
              errorMessage={passwordError}
              containerStyle={styles.inputContainer}
            />

            {password && (
              <Badge
                label={passwordStrength.toUpperCase()}
                variant={
                  passwordStrength === 'strong'
                    ? 'success'
                    : passwordStrength === 'medium'
                    ? 'info'
                    : 'destructive'
                }
                style={styles.strengthBadge}
              />
            )}
          </View>

          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureText
            showSecureToggle
            editable={!loading}
            errorMessage={confirmPasswordError}
            containerStyle={styles.inputContainer}
          />

          {error && !emailError && !passwordError && !confirmPasswordError && (
            <Text style={styles.apiError}>{error}</Text>
          )}

          <Button
            title={loading ? 'Creating Account...' : 'Create Account'}
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.registerButton}
          />
        </View>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={styles.haveAccountText}>Already have an account? </Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.signInLink}>Sign In</Text>
          </Pressable>
        </View>
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
    paddingVertical: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  backButton: {
    marginRight: SPACING.lg,
    padding: SPACING.sm,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  title: {
    ...TYPOGRAPHY.title,
    color: COLORS.textPrimary,
  },
  form: {
    marginBottom: SPACING.xxl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  passwordContainer: {
    position: 'relative',
  },
  strengthBadge: {
    marginTop: -SPACING.lg + SPACING.sm,
    marginBottom: SPACING.md,
  },
  registerButton: {
    marginTop: SPACING.xl,
  },
  apiError: {
    ...TYPOGRAPHY.caption,
    color: COLORS.destructive,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  haveAccountText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  signInLink: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: '600',
  },
});

export default RegisterScreen;
