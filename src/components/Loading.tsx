// Componente Loading global reutilizable
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';

interface LoadingProps {
  visible: boolean;
  message?: string;
  fullScreen?: boolean;
}

export default function Loading({ visible, message, fullScreen = false }: LoadingProps) {
  if (!visible) return null;

  const content = (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={theme.gradients.primary}
          style={styles.iconGradient}
        >
          <Ionicons name="hourglass-outline" size={32} color={theme.text.white} />
        </LinearGradient>
      </View>
      <ActivityIndicator size="large" color={theme.primary.main} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );

  if (fullScreen) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.modalOverlay}>
          {content}
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.overlay}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: theme.shadow.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: theme.shadow.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: theme.spacing.md,
  },
  message: {
    ...theme.typography.body,
    color: theme.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontWeight: '600',
  },
});
