// Componente de perfil de usuario con opción de cerrar sesión
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { GymUser } from '../types';
import { theme } from '../config/theme';

const roleIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  'admin': 'shield',
  'professor': 'school',
  'student': 'person',
  'person': 'person-outline',
};

const roleNames: Record<string, string> = {
  'admin': 'Admin',
  'professor': 'Profesor',
  'student': 'Alumno',
  'person': 'Persona',
};

export default function UserProfile() {
  const { user, logout, isSystemAdmin } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              setModalVisible(false);
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const getUserDisplayName = () => {
    if (isSystemAdmin) return 'Admin Sistema';
    if (user?.userType === 'gym') {
      const gymUser = user as GymUser;
      return roleNames[gymUser.role || 'admin'] || 'Usuario';
    }
    return roleNames['person'] || 'Usuario';
  };

  const getUserIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isSystemAdmin) return 'shield';
    if (user?.userType === 'gym') {
      const gymUser = user as GymUser;
      return roleIcons[gymUser.role || 'admin'] || 'person-outline';
    }
    return roleIcons['person'] || 'person-outline';
  };

  if (!user) return null;

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        style={styles.profileButton}
      >
        <View style={styles.profileButtonContent}>
          <View style={styles.profileIconContainer}>
            <Ionicons name={getUserIcon()} size={18} color={theme.text.white} />
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileTextName} numberOfLines={1}>
              {user.displayName}
            </Text>
            <Text style={styles.profileTextRole} numberOfLines={1}>
              {getUserDisplayName()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={[styles.modalContent, { 
            paddingBottom: Math.max(insets.bottom + 20, theme.spacing.xl * 1.5),
          }]}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Información del usuario compacta */}
            <View style={styles.userInfoContainer}>
              <LinearGradient
                colors={theme.gradients.primary}
                style={styles.userAvatarContainer}
              >
                <Ionicons name={getUserIcon()} size={28} color={theme.text.white} />
              </LinearGradient>
              <View style={styles.userTextContainer}>
                <Text style={styles.userName} numberOfLines={1}>{user.displayName}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{getUserDisplayName()}</Text>
              </View>
            </View>

            {/* Botón de cerrar sesión compacto */}
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.8}
              style={styles.logoutButton}
            >
              <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: theme.spacing.sm }} />
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    backgroundColor: theme.text.whiteAlpha[20],
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.text.whiteAlpha[25],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  profileTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  profileTextName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text.white,
    marginBottom: 2,
  },
  profileTextRole: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.text.whiteAlpha[90],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.background.secondary,
    borderTopLeftRadius: theme.borderRadius.xl * 1.5,
    borderTopRightRadius: theme.borderRadius.xl * 1.5,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 1000,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.background.tertiary,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.background.tertiary,
  },
  userAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  userTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text.primary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: theme.text.secondary,
  },
  roleBadge: {
    backgroundColor: theme.iconBackground.light,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accent.success,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
