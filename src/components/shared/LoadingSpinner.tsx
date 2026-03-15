import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { COLORS } from '@constants';

interface LoadingSpinnerProps {
  visible: boolean;
  transparent?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ visible, transparent = false }) => {
  if (!visible) return null;

  return (
    <Modal transparent={transparent || true} animationType="fade" visible={visible}>
      <View style={[styles.container, transparent && styles.background]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: COLORS.primaryBackground,
    borderRadius: 12,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;
