import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input } from '@components/ui';
import { LoadingSpinner } from '@components/shared';
import { validators } from '@utils/validators';
import { apiClient } from '@services/apiClient';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type ResetCodeScreenProps = StackScreenProps<AuthStackParamList, 'ResetCode'>;

const ResetCodeScreen: React.FC<ResetCodeScreenProps> = ({ navigation, route }) => {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmReset = async () => {
    setError('');

    if (code.trim().length !== 6) {
      setError('Enter the 6-digit reset code sent to your email.');
      return;
    }

    if (!validators.isPasswordValid(newPassword)) {
      setError('Password must be 8+ chars with uppercase, number and special character.');
      return;
    }

    if (!validators.doPasswordsMatch(newPassword, confirmPassword)) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.confirmPasswordReset(email, code, newPassword);
      if (response.error) {
        setError(response.error);
      } else {
        Alert.alert('Success', 'Password reset successful. Please sign in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.requestPasswordReset(email);
      if (response.error) {
        setError(response.error);
      } else {
        Alert.alert('Code Sent', `A new code was sent to ${email}`);
      }
    } catch {
      setError('Could not resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.accent} />
        </Pressable>

        <Text style={styles.title}>Enter Reset Code</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>

        <Input
          label="Reset Code"
          placeholder="123456"
          value={code}
          onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          editable={!loading}
          errorMessage={''}
        />

        <Input
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureText
          showSecureToggle
          autoCapitalize="none"
          editable={!loading}
          errorMessage={''}
        />

        <Input
          label="Confirm New Password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureText
          showSecureToggle
          autoCapitalize="none"
          editable={!loading}
          errorMessage={''}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title={loading ? 'Resetting...' : 'Reset Password'}
          onPress={handleConfirmReset}
          loading={loading}
          disabled={loading}
          style={styles.primaryButton}
        />

        <Pressable onPress={handleResend} disabled={loading}>
          <Text style={styles.resendText}>Resend code</Text>
        </Pressable>
      </View>

      <LoadingSpinner visible={loading} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING.horizontal,
    paddingTop: SPACING.xl,
  },
  backButton: {
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
  },
  title: {
    ...TYPOGRAPHY.title,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    marginTop: SPACING.md,
  },
  resendText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    textAlign: 'center',
    marginTop: SPACING.lg,
    fontWeight: '600',
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.destructive,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
});

export default ResetCodeScreen;
