// Pantalla principal del Alumno con tabs
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StudentRoutinesScreen from './StudentRoutinesScreen';
import StudentRequestsScreen from './StudentRequestsScreen';
import StudentMessagesScreen from './StudentMessagesScreen';
import StudentProfileScreen from './StudentProfileScreen';
import PageHeader from '../../components/PageHeader';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';

export default function StudentScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'routines' | 'requests' | 'messages' | 'profile'>('routines');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    loadPendingRequestsCount();
    
    // Recargar cada vez que cambie el tab a requests (por si se aceptó/rechazó alguna)
    if (activeTab === 'requests') {
      loadPendingRequestsCount();
    }
  }, [user, activeTab]);

  const loadPendingRequestsCount = async () => {
    if (!user) return;

    try {
      const pendingRequests = await requestService.getUserRequests(user.id, 'pending');
      setPendingRequestsCount(pendingRequests.length);
    } catch (error) {
      console.error('Error loading pending requests count:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
      <PageHeader 
        icon="fitness-outline"
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('routines')}
          style={[
            styles.tab,
            activeTab === 'routines' && styles.activeTab
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'routines' && styles.activeTabText
            ]}
          >
            Rutinas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('requests')}
          style={[
            styles.tab,
            activeTab === 'requests' && styles.activeTab
          ]}
        >
          <View style={styles.tabContent}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'requests' && styles.activeTabText
              ]}
            >
              Solicitudes
            </Text>
            {pendingRequestsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('messages')}
          style={[
            styles.tab,
            activeTab === 'messages' && styles.activeTab
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'messages' && styles.activeTabText
            ]}
          >
            Mensajes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('profile')}
          style={[
            styles.tab,
            activeTab === 'profile' && styles.activeTab
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'profile' && styles.activeTabText
            ]}
          >
            Perfil
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'routines' && <StudentRoutinesScreen />}
      {activeTab === 'requests' && (
        <StudentRequestsScreen 
          onRequestUpdate={() => {
            loadPendingRequestsCount();
            // También notificar al componente padre para actualizar el badge de la bottom bar
            // Esto se puede hacer con un evento o contexto si es necesario
          }} 
        />
      )}
      {activeTab === 'messages' && <StudentMessagesScreen />}
      {activeTab === 'profile' && <StudentProfileScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.background.tertiary,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.primary.main,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  activeTabText: {
    color: theme.primary.main,
  },
  tabContent: {
    position: 'relative',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.background.secondary,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
