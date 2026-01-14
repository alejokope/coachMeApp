// Pantalla de solicitudes del alumno
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import { GymRequest } from '../../types';

interface StudentRequestsScreenProps {
  onRequestUpdate?: () => void;
}

export default function StudentRequestsScreen({ onRequestUpdate }: StudentRequestsScreenProps = {}) {
  const { user, refreshUserData } = useAuth();
  const [requests, setRequests] = useState<GymRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [filter, user]);

  const loadRequests = async () => {
    if (!user) {
      console.log('StudentRequestsScreen: No hay usuario');
      return;
    }

    try {
      setLoading(true);
      console.log('StudentRequestsScreen: Cargando solicitudes para usuario:', user.id);
      console.log('StudentRequestsScreen: Filtro:', filter);
      
      const allRequests = await requestService.getUserRequests(
        user.id,
        filter === 'pending' ? 'pending' : undefined
      );
      
      console.log('StudentRequestsScreen: Solicitudes encontradas:', allRequests.length);
      console.log('StudentRequestsScreen: Solicitudes:', allRequests);
      
      setRequests(allRequests);
    } catch (error) {
      console.error('StudentRequestsScreen: Error cargando solicitudes:', error);
      Alert.alert('Error', 'No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: GymRequest) => {
    try {
      await requestService.acceptRequest(request.id, user!.id);
      // Refrescar datos del usuario para actualizar gymId en el contexto
      await refreshUserData();
      Alert.alert('Éxito', 'Solicitud aceptada');
      loadRequests();
      onRequestUpdate?.();
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
              onRequestUpdate?.();
            } catch (error) {
              Alert.alert('Error', 'No se pudo rechazar la solicitud');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Filtros */}
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={() => setFilter('pending')}
            className={`flex-1 py-3 rounded-xl items-center ${
              filter === 'pending'
                ? 'bg-amber-600'
                : 'bg-white border border-gray-200'
            }`}
          >
            <Text
              className={`font-semibold ${
                filter === 'pending' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Pendientes ({pendingRequests.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            className={`flex-1 py-3 rounded-xl items-center ${
              filter === 'all'
                ? 'bg-amber-600'
                : 'bg-white border border-gray-200'
            }`}
          >
            <Text
              className={`font-semibold ${
                filter === 'all' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Todas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de solicitudes */}
        {requests.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Text className="text-6xl mb-4">📬</Text>
            <Text className="text-xl font-bold text-gray-800 mb-2">
              No hay solicitudes
            </Text>
            <Text className="text-gray-500 text-center">
              {filter === 'pending'
                ? 'No tienes solicitudes pendientes'
                : 'No tienes solicitudes'}
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <View
              key={request.id}
              className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800 mb-1">
                    Solicitud de {request.requestedRole === 'professor' ? 'Profesor' : 'Alumno'}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {request.requestType === 'gym_to_person'
                      ? 'Gimnasio te invita'
                      : 'Solicitud enviada'}
                  </Text>
                  {request.message && (
                    <Text className="text-gray-500 text-sm mt-2">
                      {request.message}
                    </Text>
                  )}
                </View>
                <View
                  className={`px-3 py-1 rounded-full ${
                    request.status === 'pending'
                      ? 'bg-yellow-100'
                      : request.status === 'accepted'
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      request.status === 'pending'
                        ? 'text-yellow-700'
                        : request.status === 'accepted'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {request.status === 'pending'
                      ? 'Pendiente'
                      : request.status === 'accepted'
                      ? 'Aceptada'
                      : 'Rechazada'}
                  </Text>
                </View>
              </View>

              {request.status === 'pending' && (
                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    onPress={() => handleAccept(request)}
                    className="flex-1 bg-green-600 rounded-xl py-3 items-center"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-semibold">Aceptar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(request)}
                    className="flex-1 bg-red-600 rounded-xl py-3 items-center"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-semibold">Rechazar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
