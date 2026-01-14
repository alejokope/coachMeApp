// Pantalla de gestión de gimnasios mejorada y profesional
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Gym } from '../../types';
import { gymService } from '../../services/gymService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from '../../components/LoadingScreen';
import SearchUsersScreen from '../gym/SearchUsersScreen';

export default function GymManagementScreen() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [saving, setSaving] = useState(false);
  const [usersModalVisible, setUsersModalVisible] = useState(false);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadGyms();
  }, []);

  const loadGyms = async () => {
    try {
      setLoading(true);
      const data = await gymService.getAllGyms();
      setGyms(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los gimnasios');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingGym(null);
    setName('');
    setAddress('');
    setPhone('');
    setModalVisible(true);
  };

  const openEditModal = (gym: Gym) => {
    setEditingGym(gym);
    setName(gym.name);
    setAddress(gym.address || '');
    setPhone(gym.phone || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      if (editingGym) {
        await gymService.updateGym(editingGym.id, {
          name,
          address: address || undefined,
          phone: phone || undefined,
        });
        Alert.alert('Éxito', 'Gimnasio actualizado');
      } else {
        const newGym = await gymService.createGym({
          name,
          address: address || undefined,
          phone: phone || undefined,
          adminId: 'system-admin',
        });
        Alert.alert(
          'Gimnasio Creado',
          `Gimnasio "${name}" creado exitosamente. Ahora debes crear un usuario admin para este gimnasio desde Firebase Authentication.`,
          [{ text: 'OK' }]
        );
      }
      setModalVisible(false);
      loadGyms();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el gimnasio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (gym: Gym) => {
    Alert.alert(
      'Eliminar Gimnasio',
      `¿Estás seguro de eliminar "${gym.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await gymService.deleteGym(gym.id);
              Alert.alert('Éxito', 'Gimnasio eliminado');
              loadGyms();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el gimnasio');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading && gyms.length === 0) {
    return <LoadingScreen message="Cargando gimnasios..." color="#8B5CF6" icon="business-outline" />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 py-4">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-bold text-gray-800">
              Gimnasios
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              {gyms.length} {gyms.length === 1 ? 'gimnasio' : 'gimnasios'} registrados
            </Text>
          </View>
          <TouchableOpacity
            onPress={openCreateModal}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl px-6 py-3 shadow-lg flex-row items-center"
            activeOpacity={0.8}
            style={{
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons name="add-circle" size={24} color="white" style={{ marginRight: 6 }} />
            <Text className="text-white font-bold text-base">Nuevo</Text>
          </TouchableOpacity>
        </View>

        {gyms.length === 0 ? (
          <View className="bg-white rounded-3xl p-12 items-center shadow-sm">
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              className="rounded-full w-24 h-24 items-center justify-center mb-6"
            >
              <Ionicons name="business-outline" size={48} color="white" />
            </LinearGradient>
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              No hay gimnasios
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Crea el primer gimnasio para comenzar
            </Text>
            <TouchableOpacity
              onPress={openCreateModal}
              className="bg-purple-600 rounded-xl px-8 py-4"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold">Crear Primer Gimnasio</Text>
            </TouchableOpacity>
          </View>
        ) : (
          gyms.map((gym) => (
            <View
              key={gym.id}
              className="bg-white rounded-3xl p-6 mb-4 shadow-lg"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <LinearGradient
                      colors={['#8B5CF6', '#6366F1']}
                      className="rounded-xl w-12 h-12 items-center justify-center mr-3"
                    >
                      <Ionicons name="business" size={24} color="white" />
                    </LinearGradient>
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-gray-800">
                        {gym.name}
                      </Text>
                      {gym.address && (
                        <Text className="text-gray-600 text-sm mt-1">
                          📍 {gym.address}
                        </Text>
                      )}
                      {gym.phone && (
                        <Text className="text-gray-600 text-sm">
                          📞 {gym.phone}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              <View className="flex-row gap-2 mb-2">
                <TouchableOpacity
                  onPress={() => {
                    setSelectedGym(gym);
                    setUsersModalVisible(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl py-3 items-center flex-row justify-center shadow-lg"
                  activeOpacity={0.8}
                  style={{
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Ionicons name="people" size={18} color="white" style={{ marginRight: 6 }} />
                  <Text className="text-white font-bold text-sm">Usuarios</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => openEditModal(gym)}
                  className="flex-1 bg-blue-100 rounded-xl py-3 items-center flex-row justify-center"
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={18} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text className="text-blue-700 font-semibold text-sm">Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(gym)}
                  className="flex-1 bg-red-100 rounded-xl py-3 items-center flex-row justify-center"
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text className="text-red-700 font-semibold text-sm">Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal mejorado */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => !saving && setModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-2xl font-bold text-gray-800">
                  {editingGym ? 'Editar Gimnasio' : 'Nuevo Gimnasio'}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  {editingGym ? 'Modifica los datos del gimnasio' : 'Completa los datos del gimnasio'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => !saving && setModalVisible(false)}
                disabled={saving}
                className="bg-gray-100 rounded-full w-10 h-10 items-center justify-center"
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-5">
                <Text className="text-gray-700 font-semibold mb-2 text-base">
                  Nombre del Gimnasio *
                </Text>
                <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ej: Gym Fit"
                    placeholderTextColor="#9CA3AF"
                    className="text-gray-800 text-base"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View className="mb-5">
                <Text className="text-gray-700 font-semibold mb-2 text-base">
                  Dirección
                </Text>
                <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200">
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Ej: Av. Principal 123"
                    placeholderTextColor="#9CA3AF"
                    className="text-gray-800 text-base"
                  />
                </View>
                <Text className="text-gray-400 text-xs mt-2">Opcional</Text>
              </View>

              <View className="mb-6">
                <Text className="text-gray-700 font-semibold mb-2 text-base">
                  Teléfono
                </Text>
                <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200">
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Ej: +54 11 1234-5678"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    className="text-gray-800 text-base"
                  />
                </View>
                <Text className="text-gray-400 text-xs mt-2">Opcional</Text>
              </View>

              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity
                  onPress={() => !saving && setModalVisible(false)}
                  disabled={saving}
                  className="flex-1 bg-gray-200 rounded-2xl py-4 items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-gray-700 font-bold text-base">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl py-4 items-center"
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      {editingGym ? 'Actualizar' : 'Crear'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para gestionar usuarios del gimnasio */}
      <Modal
        visible={usersModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setUsersModalVisible(false)}
      >
        <View className="flex-1 bg-gray-50">
          <View className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-white mb-1">
                  Gestionar Usuarios
                </Text>
                <Text className="text-green-100">
                  {selectedGym?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setUsersModalVisible(false)}
                className="bg-white/20 rounded-full p-3"
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <View className="flex-1">
            <SearchUsersScreen gymId={selectedGym?.id} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
