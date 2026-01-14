// Pantalla de gestión de ejercicios mejorada y profesional
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
  RefreshControl,
} from 'react-native';
import { Exercise } from '../../types';
import { exerciseService } from '../../services/exerciseService';
import ExerciseCard from '../../components/ExerciseCard';
import { seedExercises } from '../../utils/seedExercises';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ExerciseManagementScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [muscleGroups, setMuscleGroups] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    loadExercises();
  }, []);

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim()) {
      const timeout = setTimeout(async () => {
        await performSearch();
      }, 500); // Esperar 500ms después de que el usuario deje de escribir
      setSearchTimeout(timeout);
    } else {
      // Si no hay búsqueda, cargar todos los ejercicios
      loadExercises();
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const data = await exerciseService.getAllExercises();
      setExercises(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los ejercicios');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExercises();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditingExercise(null);
    setName('');
    setDescription('');
    setMuscleGroups('');
    setVideoUrl('');
    setModalVisible(true);
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setName(exercise.name);
    setDescription(exercise.description || '');
    setMuscleGroups(exercise.muscleGroups.join(', '));
    setVideoUrl(exercise.videoUrl || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      const muscleGroupsArray = muscleGroups
        .split(',')
        .map((g) => g.trim())
        .filter((g) => g.length > 0);

      if (muscleGroupsArray.length === 0) {
        Alert.alert('Error', 'Debes agregar al menos un grupo muscular');
        setSaving(false);
        return;
      }

      const exerciseData: any = {
        name: name.trim(),
        muscleGroups: muscleGroupsArray,
      };

      // Solo agregar description si tiene valor
      if (description && description.trim()) {
        exerciseData.description = description.trim();
      }

      // Manejar videoUrl - si está editando, siempre pasar el valor (vacío o con contenido)
      // para que se pueda eliminar el campo si está vacío
      if (editingExercise) {
        exerciseData.videoUrl = videoUrl && videoUrl.trim() ? videoUrl.trim() : '';
      } else {
        // Al crear, solo agregar si tiene valor
        if (videoUrl && videoUrl.trim()) {
          exerciseData.videoUrl = videoUrl.trim();
        }
      }

      if (editingExercise) {
        await exerciseService.updateExercise(editingExercise.id, exerciseData);
        Alert.alert('Éxito', 'Ejercicio actualizado');
      } else {
        await exerciseService.createExercise(exerciseData);
        Alert.alert('Éxito', 'Ejercicio creado');
      }

      setModalVisible(false);
      loadExercises();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar el ejercicio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (exercise: Exercise) => {
    Alert.alert(
      'Eliminar Ejercicio',
      `¿Estás seguro de eliminar "${exercise.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await exerciseService.deleteExercise(exercise.id);
              Alert.alert('Éxito', 'Ejercicio eliminado');
              loadExercises();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el ejercicio');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSeedExercises = async () => {
    Alert.alert(
      'Agregar Ejercicios Base',
      '¿Estás seguro de que quieres agregar los ejercicios iniciales a la base de datos? Esto agregará 50+ ejercicios comunes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Agregar',
          onPress: async () => {
            try {
              setSeeding(true);
              const result = await seedExercises();
              Alert.alert(
                'Éxito',
                `Se agregaron ${result.addedCount} ejercicios exitosamente.`
              );
              loadExercises();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudieron agregar los ejercicios');
            } finally {
              setSeeding(false);
            }
          },
        },
      ]
    );
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      await loadExercises();
      return;
    }

    try {
      setSearching(true);
      const results = await exerciseService.searchExercises(searchQuery);
      setExercises(results);
    } catch (error) {
      Alert.alert('Error', 'No se pudo realizar la búsqueda');
    } finally {
      setSearching(false);
    }
  };

  const filteredExercises = exercises; // Ya viene filtrado del servicio

  if (loading && exercises.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-gray-600 mt-4 text-lg font-medium">
          Cargando ejercicios...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header mejorado con gradiente */}
      <LinearGradient
        colors={['#8B5CF6', '#6366F1', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-12 pb-6"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-3xl font-bold text-white mb-1">
              Ejercicios
            </Text>
            <Text className="text-purple-100 text-sm">
              {filteredExercises.length} {filteredExercises.length === 1 ? 'ejercicio' : 'ejercicios'} disponibles
            </Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            className="bg-white/20 rounded-full p-3"
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Búsqueda mejorada */}
        <View className="bg-white/20 backdrop-blur rounded-2xl px-4 py-3 mb-4 border border-white/30">
          <View className="flex-row items-center">
            {searching ? (
              <ActivityIndicator size="small" color="white" style={{ marginRight: 10 }} />
            ) : (
              <Ionicons name="search" size={20} color="white" style={{ marginRight: 10 }} />
            )}
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar en la base de datos..."
              placeholderTextColor="#FFFFFF90"
              className="flex-1 text-white text-base"
              style={{ color: 'white' }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Botones de acción */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={openCreateModal}
            className="flex-1 bg-white rounded-2xl py-4 items-center flex-row justify-center"
            activeOpacity={0.8}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons name="add-circle" size={24} color="#8B5CF6" style={{ marginRight: 8 }} />
            <Text className="text-purple-600 font-bold text-base">Nuevo Ejercicio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSeedExercises}
            disabled={seeding}
            className="bg-white/20 rounded-2xl py-4 px-4 items-center border-2 border-white/30"
            activeOpacity={0.8}
          >
            {seeding ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="library" size={20} color="white" />
                <Text className="text-white font-semibold text-xs mt-1">Base</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-6 py-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
      >
        {filteredExercises.length === 0 ? (
          <View className="bg-white rounded-3xl p-12 items-center shadow-sm mt-4">
            <View className="bg-purple-100 rounded-full w-24 h-24 items-center justify-center mb-6">
              <Ionicons name="fitness" size={48} color="#8B5CF6" />
            </View>
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              {searchQuery ? 'No se encontraron ejercicios' : 'No hay ejercicios'}
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              {searchQuery
                ? 'Intenta con otro término de búsqueda'
                : 'Crea tu primer ejercicio o agrega los ejercicios base'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                onPress={openCreateModal}
                className="bg-purple-600 rounded-xl px-6 py-3"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold">Crear Primer Ejercicio</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {searchQuery && (
              <View className="mb-4">
                <Text className="text-gray-600 text-sm">
                  Resultados para "{searchQuery}"
                </Text>
              </View>
            )}
            {filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onPress={() => openEditModal(exercise)}
                onEdit={() => openEditModal(exercise)}
                onDelete={() => handleDelete(exercise)}
                showActions
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Modal mejorado y profesional */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => !saving && setModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-2xl font-bold text-gray-800">
                  {editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  {editingExercise ? 'Modifica los datos del ejercicio' : 'Completa los datos del ejercicio'}
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

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="mb-5">
                <Text className="text-gray-700 font-semibold mb-2 text-base">
                  Nombre del Ejercicio *
                </Text>
                <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ej: Press de Banca"
                    placeholderTextColor="#9CA3AF"
                    className="text-gray-800 text-base"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View className="mb-5">
                <Text className="text-gray-700 font-semibold mb-2 text-base">
                  Descripción
                </Text>
                <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200 min-h-[100px]">
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe cómo realizar el ejercicio..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    className="text-gray-800 text-base"
                    textAlignVertical="top"
                  />
                </View>
                <Text className="text-gray-400 text-xs mt-2">
                  Opcional: Agrega una descripción detallada del ejercicio
                </Text>
              </View>

              <View className="mb-5">
                <Text className="text-gray-700 font-semibold mb-2 text-base">
                  Grupos Musculares * (separados por comas)
                </Text>
                <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200">
                  <TextInput
                    value={muscleGroups}
                    onChangeText={setMuscleGroups}
                    placeholder="Ej: Pecho, Tríceps, Hombros"
                    placeholderTextColor="#9CA3AF"
                    className="text-gray-800 text-base"
                  />
                </View>
                <Text className="text-gray-400 text-xs mt-2">
                  Separa cada grupo muscular con una coma
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-gray-700 font-semibold mb-2 text-base">
                  URL del Video
                </Text>
                <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200">
                  <TextInput
                    value={videoUrl}
                    onChangeText={setVideoUrl}
                    placeholder="https://youtube.com/watch?v=..."
                    placeholderTextColor="#9CA3AF"
                    keyboardType="url"
                    autoCapitalize="none"
                    className="text-gray-800 text-base"
                  />
                </View>
                <Text className="text-gray-400 text-xs mt-2">
                  Opcional: Agrega un enlace a un video explicativo
                </Text>
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
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl py-4 items-center"
                  activeOpacity={0.8}
                  style={{
                    shadowColor: '#8B5CF6',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      {editingExercise ? 'Actualizar' : 'Crear'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
