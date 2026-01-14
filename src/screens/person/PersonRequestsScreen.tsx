// Pantalla de solicitudes del usuario persona
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import { GymRequest } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import LoadingScreen from '../../components/LoadingScreen';
import PageHeader from '../../components/PageHeader';

export default function PersonRequestsScreen() {
  const { user, refreshUserData } = useAuth();
  const [requests, setRequests] = useState<GymRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [filter, user]);

  const loadRequests = async () => {
    if (!user) {
      console.log('PersonRequestsScreen: No hay usuario');
      return;
    }

    try {
      setLoading(true);
      console.log('PersonRequestsScreen: Cargando solicitudes para usuario:', user.id);
      console.log('PersonRequestsScreen: Filtro:', filter);
      
      const allRequests = await requestService.getUserRequests(
        user.id,
        filter === 'pending' ? 'pending' : undefined
      );
      
      console.log('PersonRequestsScreen: Solicitudes encontradas:', allRequests.length);
      console.log('PersonRequestsScreen: Solicitudes:', allRequests);
      
      setRequests(allRequests);
    } catch (error) {
      console.error('PersonRequestsScreen: Error cargando solicitudes:', error);
      Alert.alert('Error', 'No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAccept = async (request: GymRequest) => {
    try {
      await requestService.acceptRequest(request.id, user!.id);
      // Refrescar datos del usuario para actualizar gymId en el contexto
      await refreshUserData();
      Alert.alert('Éxito', 'Solicitud aceptada');
      loadRequests();
    } catch (error) {
      Alert.alert('Error', 'No se pudo aceptar la solicitud');
    }
  };

  const handleReject = async (request: GymRequest) => {
    Alert.alert(
      'Rechazar Solicitud',
      '¿Estás seguro de rechazar esta solicitud?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              await requestService.rejectRequest(request.id, user!.id);
              Alert.alert('Éxito', 'Solicitud rechazada');
              loadRequests();
            } catch (error) {
              Alert.alert('Error', 'No se pudo rechazar la solicitud');
            }
          },
        },
      ]
    );
  };

  if (loading && requests.length === 0) {
    return <LoadingScreen message="Cargando solicitudes..." color={theme.primary.main} icon="document-text-outline" />;
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
      <PageHeader icon="document-text-outline" />
      <ScrollView 
        contentContainerStyle={{ padding: theme.spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary.main} />
        }
      >
      {/* Debug Info */}
      {__DEV__ && user && (
        <View style={{
          backgroundColor: '#FFF3CD',
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.lg,
          borderWidth: 1,
          borderColor: '#FFC107',
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
            🔍 DEBUG INFO:
          </Text>
          <Text style={{ fontSize: 11, color: theme.text.secondary }}>
            User ID: {user.id}
          </Text>
          <Text style={{ fontSize: 11, color: theme.text.secondary }}>
            User Type: {user.userType}
          </Text>
          <Text style={{ fontSize: 11, color: theme.text.secondary }}>
            Total Requests: {requests.length}
          </Text>
          <Text style={{ fontSize: 11, color: theme.text.secondary }}>
            Pending: {pendingRequests.length}
          </Text>
        </View>
      )}

      {/* Filtros */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <TouchableOpacity
          onPress={() => setFilter('pending')}
          style={[
            styles.filterButton,
            filter === 'pending' && styles.filterButtonActive
          ]}
        >
          <Text style={[
            styles.filterText,
            filter === 'pending' && styles.filterTextActive
          ]}>
            Pendientes ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive
          ]}
        >
          <Text style={[
            styles.filterText,
            filter === 'all' && styles.filterTextActive
          ]}>
            Todas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de solicitudes */}
      {requests.length === 0 ? (
        <View style={{
          backgroundColor: theme.background.secondary,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.xxxl * 2,
          alignItems: 'center',
          shadowColor: theme.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <View style={{
            backgroundColor: theme.iconBackground.tertiary,
            borderRadius: theme.borderRadius.xl * 1.2,
            width: 80,
            height: 80,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.xl,
          }}>
            <Ionicons name="document-text-outline" size={40} color={theme.primary.main} />
          </View>
          <Text style={{
            fontSize: 22,
            fontWeight: '700',
            color: theme.text.primary,
            marginBottom: 8,
          }}>
            No hay solicitudes
          </Text>
          <Text style={{
            color: theme.text.secondary,
            textAlign: 'center',
          }}>
            {filter === 'pending'
              ? 'No tienes solicitudes pendientes'
              : 'No tienes solicitudes'}
          </Text>
        </View>
      ) : (
        requests.map((request) => {
          const statusConfig = getStatusConfig(request.status);
          return (
            <View
              key={request.id}
              style={{
                backgroundColor: theme.background.secondary,
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.xl,
                marginBottom: theme.spacing.lg,
                shadowColor: theme.shadow.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: theme.text.primary,
                    marginBottom: 4,
                  }}>
                    Solicitud de {request.requestedRole === 'professor' ? 'Profesor' : 'Alumno'}
                  </Text>
                  <Text style={{
                    color: theme.text.secondary,
                    fontSize: 14,
                    marginBottom: request.message ? 8 : 0,
                  }}>
                    {request.requestType === 'gym_to_person'
                      ? 'Gimnasio te invita'
                      : 'Solicitud enviada'}
                  </Text>
                  {request.message && (
                    <Text style={{
                      color: theme.text.tertiary,
                      fontSize: 13,
                      marginTop: 8,
                    }}>
                      {request.message}
                    </Text>
                  )}
                </View>
                <View style={{
                  backgroundColor: statusConfig.bgColor,
                  borderRadius: theme.borderRadius.xl,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: statusConfig.color,
                  }}>
                    {statusConfig.text}
                  </Text>
                </View>
              </View>

              {request.status === 'pending' && (
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleAccept(request)}
                    style={{ flex: 1 }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={theme.gradients.secondary}
                      style={{
                        borderRadius: theme.borderRadius.lg,
                        paddingVertical: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: theme.text.white, fontWeight: '700' }}>Aceptar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(request)}
                    style={{
                      flex: 1,
                      backgroundColor: theme.background.tertiary,
                      borderRadius: theme.borderRadius.lg,
                      paddingVertical: 12,
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: theme.text.secondary,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: theme.text.secondary, fontWeight: '700' }}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
    </View>
  );
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        color: theme.accent.warning,
        bgColor: theme.iconBackground.lighter,
        text: 'Pendiente',
      };
    case 'accepted':
      return {
        color: theme.accent.success,
        bgColor: theme.iconBackground.light,
        text: 'Aceptada',
      };
    case 'rejected':
      return {
        color: theme.text.secondary,
        bgColor: theme.background.tertiary,
        text: 'Rechazada',
      };
    default:
      return {
        color: theme.text.secondary,
        bgColor: theme.background.tertiary,
        text: status,
      };
  }
};

const styles = StyleSheet.create({
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    backgroundColor: theme.background.secondary,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  filterButtonActive: {
    backgroundColor: theme.primary.main,
    borderColor: theme.primary.main,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  filterTextActive: {
    color: theme.text.white,
  },
});
