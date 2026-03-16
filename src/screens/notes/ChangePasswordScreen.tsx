import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input } from '@components/ui';
import { LoadingSpinner, ScreenHeader } from '@components/shared';
import { validators } from '@utils/validators';
import { apiClient } from '@services/apiClient';
import { useAuth } from '@hooks/useAuth';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';
import type { StackScreenProps } from '@react-navigation/stack';
import type { SettingsStackParamList } from '@navigation/MainNavigator';

type ChangePasswordScreenProps = StackScreenProps<SettingsStackParamList, 'ChangePassword'>;

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const [resetCodeError, setResetCodeError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

  const validateNewPassword = (value: string) => {
    if (!validators.isPasswordValid(value)) {
      setNewPasswordError(
        'Password must be 8+ chars with uppercase, number, and special character.'
      );
      return;
    }

    setNewPasswordError('');
  };

  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    if (text.trim()) validateNewPassword(text);
  };

  const validateConfirmPassword = (value: string) => {
    if (!value.trim()) {
      setConfirmPasswordError('Please confirm password');
    } else if (value !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (text.trim()) validateConfirmPassword(text);
  };

  const handleSendCode = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'Unable to find your account email. Please re-login.');
      return;
    }

    setSendingCode(true);
    try {
      const response = await apiClient.requestPasswordReset(user.email);
      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        Alert.alert('Code Sent', `A reset code was sent to ${user.email}`);
      }
    } catch {
      Alert.alert('Error', 'Failed to send reset code. Please try again.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleChangePassword = async () => {
    Keyboard.dismiss();

    if (!user?.email) {
      Alert.alert('Error', 'Unable to find your account email. Please re-login.');
      return;
    }

    if (!resetCode.trim()) {
      setResetCodeError('Reset code is required');
      return;
    }

    if (!newPassword.trim()) {
      setNewPasswordError('New password is required');
      return;
    }
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your new password');
      return;
    }

    if (!validators.isPasswordValid(newPassword)) {
      validateNewPassword(newPassword);
      return;
    }

    if (!validators.doPasswordsMatch(newPassword, confirmPassword)) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.confirmPasswordReset(
        user.email,
        resetCode,
        newPassword
      );

      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        Alert.alert(
          'Success',
          'Password changed successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScreenHeader
        title="Change Password"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Info Section */}
          <View style={styles.infoSection}>
            <MaterialCommunityIcons
              name="security"
              size={32}
              color={COLORS.accent}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Request a reset code and set your new password.
            </Text>
            <Text style={styles.emailText}>{user?.email ?? 'Unknown account'}</Text>
          </View>

          <Button
            title={sendingCode ? 'Sending Code...' : 'Send Reset Code'}
            onPress={handleSendCode}
            loading={sendingCode}
            disabled={sendingCode || loading || !user?.email}
            fullWidth
            style={styles.sendCodeButton}
          />

          <Input
            label="Reset Code"
            placeholder="Enter 6-digit code"
            value={resetCode}
            onChangeText={(text) => {
              setResetCode(text.replace(/[^0-9]/g, '').slice(0, 6));
              if (resetCodeError) setResetCodeError('');
            }}
            keyboardType="number-pad"
            maxLength={6}
            errorMessage={resetCodeError}
            editable={!loading}
          />

          {/* New Password */}
          <Input
            label="New Password"
            placeholder="Create new password"
            value={newPassword}
            onChangeText={handleNewPasswordChange}
            secureText
            showSecureToggle
            onBlur={() => {
              if (newPassword) validateNewPassword(newPassword);
            }}
            errorMessage={newPasswordError}
            editable={!loading}
          />

          {/* Password Requirements */}
          {newPassword && (
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementTitle}>Password Requirements:</Text>
              <Requirement
                text="At least 8 characters"
                met={newPassword.length >= 8}
              />
              <Requirement text="1 uppercase letter" met={/[A-Z]/.test(newPassword)} />
              <Requirement text="1 lowercase letter" met={/[a-z]/.test(newPassword)} />
              <Requirement text="1 number" met={/[0-9]/.test(newPassword)} />
              <Requirement text="1 special character" met={/[!@#$%^&*]/.test(newPassword)} />
            </View>
          )}

          {/* Confirm Password */}
          <Input
            label="Confirm New Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            secureText
            showSecureToggle
            onBlur={() => {
              if (confirmPassword) validateConfirmPassword(confirmPassword);
            }}
            errorMessage={confirmPasswordError}
            editable={!loading}
          />

          {/* Change Button */}
          <Button
            title="Change Password"
            onPress={handleChangePassword}
            loading={loading}
            disabled={loading}
            fullWidth
            style={styles.changeButton}
          />

          {/* Security Tips */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>Security Tips:</Text>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={COLORS.accent}
              />
              <Text style={styles.tipText}>Use a strong, unique password</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={COLORS.accent}
              />
              <Text style={styles.tipText}>Don't reuse passwords from other accounts</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={COLORS.accent}
              />
              <Text style={styles.tipText}>
                You'll be logged out on all devices after changing password
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <LoadingSpinner visible={loading} />
    </KeyboardAvoidingView>
  );
};

const Requirement: React.FC<{ text: string; met: boolean }> = ({ text, met }) => (
  <View style={[styles.requirementItem, { marginBottom: SPACING.sm }]}>
    <MaterialCommunityIcons
      name={met ? 'check-circle' : 'circle-outline'}
      size={16}
      color={met ? COLORS.accent : COLORS.textMuted}
      style={styles.requirementIcon}
    />
    <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: PADDING.horizontal,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.huge,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.elevatedSurface,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
  },
  infoIcon: {
    marginBottom: SPACING.md,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    marginTop: SPACING.sm,
  },
  sendCodeButton: {
    marginBottom: SPACING.lg,
  },
  requirementsBox: {
    backgroundColor: COLORS.elevatedSurface,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    padding: SPACING.lg,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  requirementTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementIcon: {
    marginRight: SPACING.sm,
  },
  requirementText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    flex: 1,
  },
  requirementTextMet: {
    color: COLORS.accent,
  },
  changeButton: {
    marginBottom: SPACING.lg,
  },
  tipsBox: {
    backgroundColor: COLORS.elevatedSurface,
    padding: SPACING.lg,
    borderRadius: 8,
    marginTop: SPACING.lg,
  },
  tipsTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  tipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
});

export default ChangePasswordScreen;
