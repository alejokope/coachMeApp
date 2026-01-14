// Pantalla premium de solicitudes para admin de gimnasio
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { GymRequest } from '../../types';
import { requestService } from '../../services/requestService';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PersonUser } from '../../types';

export default function RequestsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<(GymRequest & { userInfo?: PersonUser })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    if (!user || user.userType !== 'gym') {
      setLoading(false);
      return;
    }
    
    const gymId = (user as any)?.gymId;
    if (!gymId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await requestService.getGymRequests(gymId);
      
      const requestsWithUserInfo = await Promise.all(
        data.map(async (request) => {
          try {
            const userInfo = await userService.getStudentById(request.userId) || 
                           await userService.getProfessorById(request.userId);
            return { ...request, userInfo: userInfo || undefined };
          } catch {
            return { ...request, userInfo: undefined };
          }
        })
      );
      
      setRequests(requestsWithUserInfo);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (request: GymRequest) => {
    Alert.alert(
      'Cancelar Solicitud',
      '¿Estás seguro de que quieres cancelar esta solicitud? El usuario ya no podrá aceptarla.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(request.id);
              await requestService.deleteRequest(request.id);
              Alert.alert('Éxito', 'Solicitud cancelada');
              loadRequests();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la solicitud');
            } finally {
              setCancelling(null);
            }
          },
        },
      ]
    );
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: '#8FAD88',
          bgColor: '#F0F9F4',
          icon: 'time-outline' as const,
          text: 'Pendiente',
        };
      case 'accepted':
        return {
          color: '#7F9C96',
          bgColor: '#E8F5E9',
          icon: 'checkmark-circle' as const,
          text: 'Aceptada',
        };
      case 'rejected':
        return {
          color: '#4D7C8A',
          bgColor: '#E0F2F1',
          icon: 'close-circle' as const,
          text: 'Rechazada',
        };
      default:
        return {
          color: '#6B7280',
          bgColor: '#F3F4F6',
          icon: 'help-circle' as const,
          text: status,
        };
    }
  };

  const getFilterConfig = (filterType: string) => {
    switch (filterType) {
      case 'all':
        return { icon: 'list' as const, label: 'Todas', color: '#1B4079' };
      case 'pending':
        return { icon: 'time' as const, label: 'Pendientes', color: '#8FAD88' };
      case 'accepted':
        return { icon: 'checkmark-circle' as const, label: 'Aceptadas', color: '#7F9C96' };
      case 'rejected':
        return { icon: 'close-circle' as const, label: 'Rechazadas', color: '#4D7C8A' };
      default:
        return { icon: 'list' as const, label: filterType, color: '#6B7280' };
    }
  };

  if (loading && requests.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#4D7C8A" />
        <Text
          style={{
            color: '#64748B',
            marginTop: 16,
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          Cargando solicitudes...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Filters Section Premium */}
      <View
        style={{
          backgroundColor: 'white',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text
            style={{
              color: '#64748B',
              fontSize: 14,
              fontWeight: '600',
            }}
          >
            {filteredRequests.length} {filteredRequests.length === 1 ? 'solicitud' : 'solicitudes'} {filter === 'all' ? 'en total' : getFilterConfig(filter).label.toLowerCase()}
          </Text>
          <TouchableOpacity
            onPress={loadRequests}
            style={{
              backgroundColor: '#F1F5F9',
              borderRadius: 12,
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="#4D7C8A" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => {
            const config = getFilterConfig(f);
            const isActive = filter === f;
            const count = requests.filter((r) => f === 'all' || r.status === f).length;
            
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  marginRight: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isActive ? 'white' : '#F1F5F9',
                  borderWidth: isActive ? 2 : 0,
                  borderColor: config.color,
                  shadowColor: isActive ? config.color : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.2 : 0.05,
                  shadowRadius: 4,
                  elevation: isActive ? 3 : 1,
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={config.icon}
                  size={16}
                  color={isActive ? config.color : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: isActive ? config.color : '#64748B',
                  }}
                >
                  {config.label}
                </Text>
                {count > 0 && (
                  <View
                    style={{
                      backgroundColor: isActive ? config.color : '#CBD5E1',
                      borderRadius: 10,
                      minWidth: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 6,
                      marginLeft: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: isActive ? 'white' : '#64748B',
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadRequests();
              setRefreshing(false);
            }}
            tintColor="#4D7C8A"
          />
        }
      >
        {filteredRequests.length === 0 ? (
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 40,
              alignItems: 'center',
              marginTop: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                backgroundColor: '#F1F5F9',
                borderRadius: 20,
                width: 80,
                height: 80,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Ionicons name="document-text-outline" size={40} color="#94A3B8" />
            </View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: 8,
              }}
            >
              No hay solicitudes
            </Text>
            <Text
              style={{
                color: '#64748B',
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              {filter === 'all'
                ? 'No hay solicitudes registradas'
                : `No hay solicitudes ${getFilterConfig(filter).label.toLowerCase()}`}
            </Text>
          </View>
        ) : (
          filteredRequests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const userInfo = request.userInfo;
            
            return (
              <View
                key={request.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                  <LinearGradient
                    colors={
                      request.requestedRole === 'professor'
                        ? ['#7F9C96', '#8FAD88']
                        : ['#4D7C8A', '#7F9C96']
                    }
                    style={{
                      borderRadius: 16,
                      width: 56,
                      height: 56,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16,
                    }}
                  >
                    <Ionicons
                      name={request.requestedRole === 'professor' ? 'school' : 'person'}
                      size={24}
                      color="white"
                    />
                  </LinearGradient>
                  
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: '700',
                          color: '#0F172A',
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {userInfo?.displayName || 'Usuario'}
                      </Text>
                      <View
                        style={{
                          backgroundColor: statusConfig.bgColor,
                          borderRadius: 12,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginLeft: 8,
                        }}
                      >
                        <Ionicons
                          name={statusConfig.icon}
                          size={14}
                          color={statusConfig.color}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: statusConfig.color,
                          }}
                        >
                          {statusConfig.text}
                        </Text>
                      </View>
                    </View>
                    
                    <Text
                      style={{
                        color: '#64748B',
                        fontSize: 14,
                        marginBottom: 10,
                      }}
                      numberOfLines={1}
                    >
                      {userInfo?.email || request.userId.substring(0, 8) + '...'}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <View
                        style={{
                          backgroundColor: request.requestedRole === 'professor' ? '#E8F5E9' : '#E0F2F1',
                          borderRadius: 12,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: request.requestedRole === 'professor' ? '#7F9C96' : '#4D7C8A',
                          }}
                        >
                          {request.requestedRole === 'professor' ? 'Profesor' : 'Alumno'}
                        </Text>
                      </View>
                      
                      {request.requestType === 'person_to_gym' && (
                        <View
                          style={{
                            backgroundColor: '#F0F7F9',
                            borderRadius: 12,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: '#7F9C96',
                            }}
                          >
                            Usuario solicitó
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <Text
                      style={{
                        color: '#94A3B8',
                        fontSize: 12,
                        marginTop: 12,
                      }}
                    >
                      {request.createdAt.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })} a las {request.createdAt.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>

                {request.status === 'pending' && (
                  <>
                    <View
                      style={{
                        backgroundColor: '#F0F9F4',
                        borderRadius: 14,
                        padding: 12,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: '#E8F5E9',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Ionicons name="information-circle" size={18} color="#8FAD88" style={{ marginRight: 8, marginTop: 1 }} />
                        <Text
                          style={{
                            color: '#7F9C96',
                            fontSize: 12,
                            flex: 1,
                            lineHeight: 16,
                          }}
                        >
                          Esta solicitud está pendiente. El usuario debe aceptarla desde su cuenta.
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => handleCancel(request)}
                      disabled={cancelling === request.id}
                      style={{
                        borderRadius: 14,
                        paddingVertical: 12,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        backgroundColor: '#F0F7F9',
                        borderWidth: 2,
                        borderColor: '#4D7C8A',
                      }}
                      activeOpacity={0.8}
                    >
                      {cancelling === request.id ? (
                        <ActivityIndicator color="#4D7C8A" size="small" />
                      ) : (
                        <>
                          <Ionicons name="close-circle" size={18} color="#4D7C8A" style={{ marginRight: 8 }} />
                          <Text
                            style={{
                              color: '#4D7C8A',
                              fontSize: 14,
                              fontWeight: '700',
                            }}
                          >
                            Cancelar Solicitud
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
