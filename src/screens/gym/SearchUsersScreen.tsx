// Pantalla premium para buscar usuarios y enviar solicitudes
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { requestService } from '../../services/requestService';
import { PersonUser, PersonRole, GymRequest } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../config/theme';

interface SearchUsersScreenProps {
  gymId?: string;
}

export default function SearchUsersScreen({ gymId: propGymId }: SearchUsersScreenProps = { gymId: undefined }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PersonUser[]>([]);
  const [pendingRequestsMap, setPendingRequestsMap] = useState<Map<string, GymRequest>>(new Map());
  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PersonUser | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const getUserGymId = () => {
    if (propGymId) {
      console.log('SearchUsersScreen: Usando propGymId:', propGymId);
      return propGymId;
    }
    if (user?.userType === 'gym') {
      const gymUser = user as any;
      const gymId = gymUser.gymId || gymUser.gym_id || (user as any).gymId;
      console.log('SearchUsersScreen: Obteniendo gymId del usuario:', {
        userType: user.userType,
        gymId: gymId,
        userObject: user,
      });
      return gymId;
    }
    console.log('SearchUsersScreen: No se pudo obtener gymId - userType:', user?.userType);
    return undefined;
  };
  
  const targetGymId = getUserGymId();
  
  useEffect(() => {
    console.log('SearchUsersScreen: targetGymId actualizado:', targetGymId);
  }, [targetGymId]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch();
      }, 500);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (!targetGymId && user?.userType === 'gym') {
      console.log('SearchUsersScreen: No hay targetGymId, cancelando búsqueda');
      return;
    }

    try {
      setLoading(true);
      console.log('SearchUsersScreen: Iniciando búsqueda con término:', searchQuery);
      console.log('SearchUsersScreen: targetGymId:', targetGymId);
      
      const results = await userService.searchUsers(searchQuery);
      console.log('SearchUsersScreen: Resultados de búsqueda:', results.length);
      console.log('SearchUsersScreen: Resultados:', results.map(u => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        gymId: u.gymId,
      })));
      
      // Filtrar usuarios que NO pertenecen al gym actual
      // Incluir: usuarios sin gymId o con gymId diferente
      // Excluir: usuarios que ya pertenecen al gym actual
      const filtered = results.filter((u) => {
        const hasGymId = !!u.gymId;
        const belongsToCurrentGym = u.gymId === targetGymId;
        const shouldInclude = !hasGymId || !belongsToCurrentGym;
        
        if (!shouldInclude) {
          console.log('SearchUsersScreen: Usuario excluido (ya pertenece al gym):', {
            id: u.id,
            email: u.email,
            displayName: u.displayName,
            gymId: u.gymId,
            targetGymId,
          });
        }
        
        return shouldInclude;
      });
      
      console.log('SearchUsersScreen: Resultados después de filtrar por gymId:', filtered.length);
      console.log('SearchUsersScreen: IDs finales:', filtered.map(u => u.id));
      
      // Cargar solicitudes pendientes para estos usuarios
      if (targetGymId && filtered.length > 0) {
        const userIds = filtered.map(u => u.id);
        const pendingRequests = await requestService.getPendingRequestsForUsers(userIds, targetGymId);
        console.log('SearchUsersScreen: Solicitudes pendientes encontradas:', pendingRequests.size);
        setPendingRequestsMap(pendingRequests);
      } else {
        setPendingRequestsMap(new Map());
      }
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('SearchUsersScreen: Error en búsqueda:', error);
      Alert.alert('Error', 'No se pudo realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const detectUserRole = (targetUser: PersonUser): PersonRole | null => {
    if (targetUser.role === 'professor' || targetUser.role === 'student') {
      return targetUser.role;
    }
    return 'student';
  };

  const handleSendRequest = async () => {
    if (!selectedUser || !targetGymId) {
      Alert.alert('Error', 'No se puede enviar la solicitud');
      return;
    }

    const detectedRole = detectUserRole(selectedUser);
    if (!detectedRole) {
      Alert.alert('Error', 'No se pudo determinar el rol del usuario');
      return;
    }

    try {
      setSendingRequest(selectedUser.id);
      await requestService.createRequest(
        selectedUser.id,
        targetGymId,
        detectedRole,
        'gym_to_person',
        requestMessage.trim() || undefined
      );
      
      const userDisplayName = selectedUser.displayName;
      const userId = selectedUser.id;
      
      setShowRequestModal(false);
      setRequestMessage('');
      
      // Actualizar el mapa de solicitudes pendientes antes de cerrar el modal
      if (detectedRole && targetGymId) {
        const newRequest: GymRequest = {
          id: 'temp', // Se actualizará cuando se recargue
          userId: userId,
          gymId: targetGymId,
          requestedRole: detectedRole,
          requestType: 'gym_to_person',
          status: 'pending',
          createdAt: new Date(),
        };
        setPendingRequestsMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(userId, newRequest);
          return newMap;
        });
      }
      
      setSelectedUser(null);
      
      Alert.alert(
        '✅ Solicitud Enviada',
        `Se ha enviado una solicitud a ${userDisplayName} para unirse como ${detectedRole === 'professor' ? 'Profesor' : 'Alumno'}.`,
        [{ text: 'OK' }]
      );
      
      // No eliminar el usuario de los resultados, solo marcarlo como con solicitud pendiente
    } catch (error: any) {
      let errorMessage = 'No se pudo enviar la solicitud';
      
      if (error.message?.includes('Ya existe una solicitud pendiente')) {
        errorMessage = `Ya existe una solicitud pendiente para ${selectedUser?.displayName}. Por favor, revisa la sección de solicitudes pendientes.`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSendingRequest(null);
    }
  };

  const openRequestModal = (targetUser: PersonUser) => {
    if (!targetGymId) {
      Alert.alert(
        'Error de Configuración',
        'No se puede enviar solicitudes porque tu usuario no tiene gymId asignado.'
      );
      return;
    }

    const detectedRole = detectUserRole(targetUser);
    if (!detectedRole) {
      Alert.alert('Error', 'No se pudo determinar el rol del usuario');
      return;
    }

    // Verificar si ya existe una solicitud pendiente
    const pendingRequest = pendingRequestsMap.get(targetUser.id);
    if (pendingRequest) {
      Alert.alert(
        'Solicitud Pendiente',
        `Ya existe una solicitud pendiente para ${targetUser.displayName} como ${detectedRole === 'professor' ? 'Profesor' : 'Alumno'}. Por favor, revisa la sección de solicitudes pendientes.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedUser(targetUser);
    setRequestMessage('');
    setShowRequestModal(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Search Bar Compact */}
      <View
        style={{
          backgroundColor: 'white',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: searchQuery.length >= 2 ? '#4D7C8A' : '#E2E8F0',
          }}
        >
          <Ionicons name="search" size={18} color={searchQuery.length >= 2 ? '#4D7C8A' : '#64748B'} style={{ marginRight: 10 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre o email..."
            placeholderTextColor="#94A3B8"
            style={{
              flex: 1,
              color: '#0F172A',
              fontSize: 15,
              fontWeight: '500',
            }}
            autoCapitalize="none"
            autoComplete="off"
            textContentType="none"
            returnKeyType="search"
          />
          {loading && (
            <ActivityIndicator color="#4D7C8A" size="small" style={{ marginLeft: 8 }} />
          )}
          {searchQuery.length > 0 && !loading && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={{ marginLeft: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
            refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={performSearch}
            tintColor="#4D7C8A"
          />
        }
      >
        {/* Loading State */}
        {loading && searchResults.length === 0 && (
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
            <ActivityIndicator size="large" color="#4D7C8A" />
            <Text
              style={{
                color: '#64748B',
                marginTop: 16,
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Buscando usuarios...
            </Text>
          </View>
        )}

        {/* Results */}
        {!loading && searchResults.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#0F172A',
                  letterSpacing: -0.3,
                }}
              >
                {searchResults.length} {searchResults.length === 1 ? 'usuario encontrado' : 'usuarios encontrados'}
              </Text>
            </View>
            
            {searchResults.map((result) => {
              const detectedRole = detectUserRole(result);
              const isProfessor = detectedRole === 'professor';
              
              return (
                <View
                  key={result.id}
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
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <LinearGradient
                      colors={isProfessor ? ['#7F9C96', '#8FAD88'] : ['#4D7C8A', '#7F9C96']}
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
                        name={isProfessor ? 'school' : 'person'}
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
                          {result.displayName}
                        </Text>
                        <View
                          style={{
                            backgroundColor: isProfessor ? '#E8F5E9' : '#E0F2F1',
                            borderRadius: 12,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            marginLeft: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: isProfessor ? '#7F9C96' : '#4D7C8A',
                            }}
                          >
                            {isProfessor ? 'Profesor' : 'Alumno'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Ionicons name="mail-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                        <Text
                          style={{
                            color: '#64748B',
                            fontSize: 14,
                            flex: 1,
                          }}
                          numberOfLines={1}
                        >
                          {result.email}
                        </Text>
                      </View>
                      
                      {result.gymId && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="business-outline" size={14} color="#8FAD88" style={{ marginRight: 6 }} />
                          <Text
                            style={{
                              color: '#8FAD88',
                              fontSize: 12,
                              fontWeight: '600',
                            }}
                          >
                            Ya pertenece a otro gimnasio
                          </Text>
                        </View>
                      )}
                      
                      {pendingRequestsMap.has(result.id) && (
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center',
                          marginTop: 8,
                          backgroundColor: '#FFF3CD',
                          borderRadius: 8,
                          padding: 8,
                        }}>
                          <Ionicons name="time-outline" size={14} color="#F59E0B" style={{ marginRight: 6 }} />
                          <Text
                            style={{
                              color: '#F59E0B',
                              fontSize: 12,
                              fontWeight: '600',
                            }}
                          >
                            Solicitud pendiente
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => openRequestModal(result)}
                    disabled={sendingRequest === result.id || pendingRequestsMap.has(result.id)}
                    style={{
                      marginTop: 16,
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      backgroundColor: pendingRequestsMap.has(result.id) 
                        ? '#F1F5F9' 
                        : (isProfessor ? '#F0F9F4' : '#F0F7F9'),
                      borderWidth: 2,
                      borderColor: pendingRequestsMap.has(result.id)
                        ? '#94A3B8'
                        : (isProfessor ? '#7F9C96' : '#4D7C8A'),
                      opacity: pendingRequestsMap.has(result.id) ? 0.6 : 1,
                    }}
                    activeOpacity={0.8}
                  >
                    {sendingRequest === result.id ? (
                      <ActivityIndicator color={isProfessor ? '#7F9C96' : '#4D7C8A'} size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name={pendingRequestsMap.has(result.id) ? "checkmark-circle" : "person-add"}
                          size={18}
                          color={pendingRequestsMap.has(result.id) 
                            ? '#94A3B8' 
                            : (isProfessor ? '#7F9C96' : '#4D7C8A')}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '700',
                            color: pendingRequestsMap.has(result.id)
                              ? '#94A3B8'
                              : (isProfessor ? '#7F9C96' : '#4D7C8A'),
                          }}
                        >
                          {pendingRequestsMap.has(result.id) ? 'Solicitud Enviada' : 'Enviar Solicitud'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* No Results */}
        {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
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
              <Ionicons name="search-outline" size={40} color="#94A3B8" />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: 8,
              }}
            >
              No se encontraron usuarios
            </Text>
            <Text
              style={{
                color: '#64748B',
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              Intenta con otro término de búsqueda
            </Text>
          </View>
        )}

        {/* Initial State */}
        {!loading && searchQuery.length < 2 && (
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 32,
              alignItems: 'center',
              marginTop: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <LinearGradient
              colors={['#1B4079', '#4D7C8A']}
              style={{
                borderRadius: 20,
                width: 80,
                height: 80,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Ionicons name="search" size={40} color="white" />
            </LinearGradient>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: 8,
                letterSpacing: -0.5,
              }}
            >
              Buscar Usuarios
            </Text>
            <Text
              style={{
                color: '#64748B',
                fontSize: 15,
                textAlign: 'center',
                marginBottom: 24,
                lineHeight: 22,
              }}
            >
              Busca profesores o alumnos por nombre o email para invitarlos a tu gimnasio
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#F0F9F4',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#7F9C96',
                }}
              >
                <Ionicons name="school" size={24} color="#7F9C96" style={{ marginBottom: 8 }} />
                <Text
                  style={{
                    color: '#7F9C96',
                    fontSize: 14,
                    fontWeight: '700',
                    marginBottom: 4,
                  }}
                >
                  Profesores
                </Text>
                <Text
                  style={{
                    color: '#8FAD88',
                    fontSize: 12,
                    fontWeight: '500',
                  }}
                >
                  Invita profesores
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#F0F7F9',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#4D7C8A',
                }}
              >
                <Ionicons name="people" size={24} color="#4D7C8A" style={{ marginBottom: 8 }} />
                <Text
                  style={{
                    color: '#4D7C8A',
                    fontSize: 14,
                    fontWeight: '700',
                    marginBottom: 4,
                  }}
                >
                  Alumnos
                </Text>
                <Text
                  style={{
                    color: '#7F9C96',
                    fontSize: 12,
                    fontWeight: '500',
                  }}
                >
                  Invita alumnos
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Premium Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowRequestModal(false)}
          />
          <View
            style={[styles.modalContent, { 
              paddingBottom: Math.max(insets.bottom + 20, theme.spacing.xl * 1.5),
            }]}
          >
            {/* Handle bar */}
            <View style={styles.handleBar} />
            
            {selectedUser && (
              <>
                <View style={styles.userInfoContainer}>
                  <LinearGradient
                    colors={
                      detectUserRole(selectedUser) === 'professor'
                        ? theme.gradients.secondary
                        : theme.gradients.primary
                    }
                    style={styles.userAvatarContainer}
                  >
                    <Ionicons
                      name={detectUserRole(selectedUser) === 'professor' ? 'school' : 'person'}
                      size={24}
                      color={theme.text.white}
                    />
                  </LinearGradient>
                  <View style={styles.userTextContainer}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {selectedUser.displayName}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {selectedUser.email}
                    </Text>
                  </View>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {detectUserRole(selectedUser) === 'professor' ? 'Profesor' : 'Alumno'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <View style={styles.infoContent}>
                    <Ionicons
                      name="information-circle"
                      size={18}
                      color={detectUserRole(selectedUser) === 'professor' ? theme.primary.light : theme.primary.main}
                      style={styles.infoIcon}
                    />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoTitle}>
                        Solicitud de {detectUserRole(selectedUser) === 'professor' ? 'Profesor' : 'Alumno'}
                      </Text>
                      <Text style={styles.infoDescription}>
                        Se enviará una solicitud a {selectedUser.displayName} para unirse como {detectUserRole(selectedUser) === 'professor' ? 'profesor' : 'alumno'} a tu gimnasio.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.messageContainer}>
                  <Text style={styles.messageLabel}>
                    Mensaje (opcional)
                  </Text>
                  <TextInput
                    value={requestMessage}
                    onChangeText={setRequestMessage}
                    placeholder="Escribe un mensaje personalizado..."
                    placeholderTextColor={theme.text.tertiary}
                    multiline
                    numberOfLines={3}
                    style={styles.messageInput}
                    autoComplete="off"
                    textContentType="none"
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    onPress={() => setShowRequestModal(false)}
                    style={styles.cancelButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSendRequest}
                    disabled={sendingRequest !== null}
                    style={[
                      styles.sendButton,
                      {
                        backgroundColor: detectUserRole(selectedUser) === 'professor' 
                          ? theme.primary.light 
                          : theme.primary.main,
                        opacity: sendingRequest !== null ? 0.6 : 1,
                      }
                    ]}
                    activeOpacity={0.8}
                  >
                    {sendingRequest ? (
                      <ActivityIndicator color={theme.text.white} />
                    ) : (
                      <View style={styles.sendButtonContent}>
                        <Ionicons name="send" size={16} color={theme.text.white} style={{ marginRight: theme.spacing.sm }} />
                        <Text style={styles.sendButtonText}>
                          Enviar Solicitud
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: theme.background.secondary,
    borderTopLeftRadius: theme.borderRadius.xl * 1.5,
    borderTopRightRadius: theme.borderRadius.xl * 1.5,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    maxHeight: '85%',
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
  infoBox: {
    backgroundColor: theme.iconBackground.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    color: theme.text.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoDescription: {
    color: theme.text.secondary,
    fontSize: 12,
    lineHeight: 16,
  },
  messageContainer: {
    marginBottom: theme.spacing.lg,
  },
  messageLabel: {
    color: theme.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  messageInput: {
    backgroundColor: theme.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.text.primary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    shadowColor: theme.shadow.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButtonText: {
    color: theme.text.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
