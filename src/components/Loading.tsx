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
      <LinearGradient
        colors={theme.gradients.primary}
        style={styles.iconContainer}
      >
        <Ionicons name="hourglass-outline" size={32} color={theme.text.white} />
      </LinearGradient>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  spinner: {
    marginBottom: theme.spacing.md,
  },
  message: {
    ...theme.typography.body,
    color: theme.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});
