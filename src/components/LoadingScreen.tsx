// Componente de carga profesional y moderno
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';

interface LoadingScreenProps {
  message?: string;
  color?: string;
  icon?: string;
}

export default function LoadingScreen({ 
  message = 'Cargando...', 
  color = theme.primary.main,
  icon = 'hourglass-outline'
}: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.background.primary, theme.background.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {icon && (
            <View style={styles.iconWrapper}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBackground.light }]}>
                <LinearGradient
                  colors={theme.gradients.primary}
                  style={styles.iconGradient}
                >
                  <Ionicons name={icon as any} size={48} color={theme.text.white} />
                </LinearGradient>
              </View>
            </View>
          )}
          <ActivityIndicator size="large" color={color} style={styles.spinner} />
          <Text style={styles.message}>
            {message}
          </Text>
          <Text style={styles.submessage}>
            Por favor espera...
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginBottom: theme.spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.shadow.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: theme.spacing.lg,
  },
  message: {
    ...theme.typography.h3,
    color: theme.text.primary,
    fontWeight: '700',
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  submessage: {
    ...theme.typography.body,
    color: theme.text.secondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});
