import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants';

interface BiometricPromptProps {
  visible: boolean;
  biometricsType?: 'Fingerprint' | 'FaceID' | 'Iris';
  onAuthenticate: () => Promise<void>;
  onUsePinInstead: () => void;
  loading?: boolean;
}

const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  visible,
  biometricsType = 'Fingerprint',
  onAuthenticate,
  onUsePinInstead,
  loading = false,
}) => {
  const getIconName = () => {
    switch (biometricsType) {
      case 'FaceID':
        return 'face-recognition';
      case 'Iris':
        return 'eye';
      case 'Fingerprint':
      default:
        return 'fingerprint';
    }
  };

  const getHeading = () => {
    switch (biometricsType) {
      case 'FaceID':
        return 'Unlock with Face ID';
      case 'Iris':
        return 'Unlock with Iris';
      case 'Fingerprint':
      default:
        return 'Unlock with Fingerprint';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.mainHeading}>Unlock SecureNotes</Text>

          <View style={styles.iconContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.accent} />
            ) : (
              <MaterialCommunityIcons
                name={getIconName()}
                size={80}
                color={COLORS.accent}
              />
            )}
          </View>

          <Text style={styles.heading}>{getHeading()}</Text>

          <Pressable
            onPress={onAuthenticate}
            disabled={loading}
            style={({ pressed }) => [
              styles.authenticateButton,
              pressed && styles.authenticateButtonPressed,
              loading && styles.authenticateButtonDisabled,
            ]}
          >
            <MaterialCommunityIcons
              name={getIconName()}
              size={48}
              color={COLORS.primaryBackground}
            />
          </Pressable>

          <Text style={styles.instruction}>
            {biometricsType === 'FaceID'
              ? 'Show your face to the camera'
              : 'Place your finger on the sensor'}
          </Text>

          <Pressable
            onPress={onUsePinInstead}
            disabled={loading}
            style={({ pressed }) => [styles.fallbackLink, pressed && styles.fallbackLinkPressed]}
          >
            <Text style={styles.fallbackText}>Use PIN instead</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 22, 40, 0.95)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.primaryBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mainHeading: {
    ...TYPOGRAPHY.title,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xxl,
  },
  iconContainer: {
    marginBottom: SPACING.xxl,
    height: 100,
    justifyContent: 'center',
  },
  heading: {
    ...TYPOGRAPHY.sectionHeader,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  authenticateButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  authenticateButtonPressed: {
    opacity: 0.85,
  },
  authenticateButtonDisabled: {
    opacity: 0.6,
  },
  instruction: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  fallbackLink: {
    paddingVertical: SPACING.md,
  },
  fallbackLinkPressed: {
    opacity: 0.7,
  },
  fallbackText: {
    ...TYPOGRAPHY.body,
    color: COLORS.info,
    fontWeight: '600',
  },
});

export default BiometricPrompt;
