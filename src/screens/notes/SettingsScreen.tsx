import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, Switch, SafeAreaView, Alert, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@hooks/useAuth';
import { useBiometrics } from '@hooks/useBiometrics';
import { Button, Card } from '@components/ui';
import { ScreenHeader, ConfirmDialog } from '@components/shared';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';
import type { StackScreenProps } from '@react-navigation/stack';
import type { SettingsStackParamList } from '@navigation/MainNavigator';

type SettingsScreenProps = StackScreenProps<SettingsStackParamList, 'SettingsMain'>;

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }): React.JSX.Element => {
  const { user, logout } = useAuth();
  const { isAvailable: isBiometricAvailable, biometricsType } = useBiometrics();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    checkBiometricSettings();
  }, []);

  const checkBiometricSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      if (enabled === 'true') {
        setBiometricEnabled(true);
      }
    } catch (error) {
      console.error('Error checking biometric settings:', error);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!isBiometricAvailable) {
      Alert.alert('Biometric Not Available', 'Your device does not support biometric authentication');
      return;
    }

    try {
      if (value) {
        await AsyncStorage.setItem('biometric_enabled', 'true');
      } else {
        await AsyncStorage.removeItem('biometric_enabled');
      }
      setBiometricEnabled(value);
    } catch (error) {
      console.error('Error saving biometric preference:', error);
      Alert.alert('Error', 'Failed to save biometric preference');
    }
  };

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleForgotPassword = () => {
    // Navigate to the auth stack's ForgotPassword screen
    // We'll need to navigate through the app navigator
    Alert.alert(
      'Reset Password',
      'You will be logged out to reset your password. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await logout();
            // The app will navigate to Auth screen automatically
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Settings"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <Card style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email || 'Not set'}</Text>
            </View>
          </Card>

          <Button
            title="Logout"
            variant="destructive"
            size="small"
            onPress={() => setShowLogoutDialog(true)}
            style={styles.logoutButton}
          />
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          {isBiometricAvailable && (
            <Card style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingLabel}>
                  <Text style={styles.label}>
                    {biometricsType === 'FaceID'
                      ? 'Face ID Unlock'
                      : 'Biometric Unlock'}
                  </Text>
                  <Text style={styles.description}>
                    {biometricsType === 'FaceID'
                      ? 'Use Face ID to unlock'
                      : 'Use fingerprint to unlock'}
                  </Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: COLORS.elevatedSurface, true: COLORS.accentDark }}
                  thumbColor={biometricEnabled ? COLORS.accent : COLORS.textSecondary}
                />
              </View>
            </Card>
          )}

          <Card style={styles.card}>
            <Pressable onPress={handleChangePassword}>
              <View style={styles.settingRow}>
                <View style={styles.settingLabel}>
                  <Text style={styles.label}>Change Password</Text>
                  <Text style={styles.description}>Update your password</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={COLORS.textMuted}
                />
              </View>
            </Pressable>
          </Card>

          <Card style={styles.card}>
            <Pressable onPress={handleForgotPassword}>
              <View style={styles.settingRow}>
                <View style={styles.settingLabel}>
                  <Text style={styles.label}>Forgot Password?</Text>
                  <Text style={styles.description}>Reset your password</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={COLORS.textMuted}
                />
              </View>
            </Pressable>
          </Card>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>

          <Card style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.label}>Version</Text>
              <Text style={styles.value}>1.0.0</Text>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.label}>About SecureNotes</Text>
            </View>
            <Text style={styles.description}>
              A security-first note-taking app with biometric authentication and end-to-end
              protection for your sensitive information.
            </Text>
          </Card>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showLogoutDialog}
        title="Logout?"
        message="You will be logged out of SecureNotes. Are you sure?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </SafeAreaView>
  );
};

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
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionHeader,
    color: COLORS.accent,
    marginBottom: SPACING.lg,
    textTransform: 'uppercase',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  card: {
    marginBottom: SPACING.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    flex: 1,
  },
  label: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  value: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  description: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  logoutButton: {
    marginTop: SPACING.lg,
  },
});

export default SettingsScreen;
