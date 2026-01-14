// Pantalla para configurar máximos personales mejorada y profesional
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Exercise, PersonalMax } from '../../types';
import { exerciseService } from '../../services/exerciseService';
import { personalMaxService } from '../../services/personalMaxService';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '../../components/Toast';
import LoadingScreen from '../../components/LoadingScreen';

export default function PersonalMaxScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [personalMaxs, setPersonalMaxs] = useState<PersonalMax[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [maxWeight, setMaxWeight] = useState('');
  const [maxReps, setMaxReps] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const gymId = (user as any)?.gymId;
      const exercisesData = await exerciseService.getAllExercises(gymId);
      setExercises(exercisesData);

      if (user?.id) {
        const maxs = await personalMaxService.getUserMaxs(user.id);
        setPersonalMaxs(maxs);
      }
    } catch (error) {
      showToast('No se pudieron cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openModal = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    const existing = personalMaxs.find(
      (m) => m.exerciseId === exercise.id && m.userId === user?.id
    );
    setMaxWeight(existing?.maxWeight.toString() || '');
    setMaxReps(existing?.maxReps?.toString() || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedExercise || !maxWeight.trim() || !user?.id) {
      showToast('El peso máximo es obligatorio', 'error');
      return;
    }

    try {
      setSaving(true);
      await personalMaxService.saveMax({
        userId: user.id,
        exerciseId: selectedExercise.id,
        maxWeight: parseFloat(maxWeight),
        maxReps: maxReps ? parseInt(maxReps) : undefined,
      });
      setModalVisible(false);
      await loadData();
      showToast('Máximo personal guardado', 'success');
      setModalVisible(false);
    } catch (error) {
      showToast('No se pudo guardar el máximo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getMaxForExercise = (exerciseId: string) => {
    return personalMaxs.find(
      (m) => m.exerciseId === exerciseId && m.userId === user?.id
    );
  };

  const filteredExercises = searchQuery.trim()
    ? exercises.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.muscleGroups.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : exercises;

  if (loading && exercises.length === 0) {
    return <LoadingScreen message="Cargando ejercicios..." color={theme.primary.main} icon="fitness-outline" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary.main} />
        }
      >
        {/* Búsqueda */}
        <View style={{
          backgroundColor: theme.background.secondary,
          borderRadius: theme.borderRadius.xl,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          marginBottom: theme.spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: theme.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Ionicons name="search" size={20} color={theme.text.secondary} style={{ marginRight: theme.spacing.md }} />
          <TextInput
            placeholder="Buscar ejercicios..."
            placeholderTextColor={theme.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              color: theme.text.primary,
              fontSize: 15,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
        {filteredExercises.length === 0 ? (
          <View className="bg-white rounded-3xl p-12 items-center shadow-sm mt-4">
            <View className="bg-purple-100 rounded-full w-24 h-24 items-center justify-center mb-6">
              <Ionicons name="fitness" size={48} color="#8B5CF6" />
            </View>
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              {searchQuery ? 'No se encontraron ejercicios' : 'No hay ejercicios'}
            </Text>
            <Text className="text-gray-500 text-center">
              {searchQuery
                ? 'Intenta con otro término de búsqueda'
                : 'Los ejercicios se cargan desde la base de datos'}
            </Text>
          </View>
        ) : (
          filteredExercises.map((exercise) => {
            const max = getMaxForExercise(exercise.id);
            return (
              <TouchableOpacity
                key={exercise.id}
                onPress={() => openModal(exercise)}
                className="bg-white rounded-3xl p-5 mb-4 shadow-sm flex-row items-center"
                activeOpacity={0.7}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={max ? ['#10B981', '#059669'] : ['#6B7280', '#4B5563']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                >
                  <Ionicons name="barbell" size={28} color="white" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800 mb-1">
                    {exercise.name}
                  </Text>
                  {max ? (
                    <View className="flex-row items-center">
                      <Text className="text-green-600 font-bold text-base">
                        {max.maxWeight} kg
                      </Text>
                      {max.maxReps && (
                        <Text className="text-gray-600 text-sm ml-2">
                          x {max.maxReps} reps
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text className="text-gray-400 text-sm">No configurado</Text>
                  )}
                  <View className="flex-row flex-wrap mt-2">
                    {(exercise.muscleGroups || []).slice(0, 2).map((group, idx) => (
                      <View
                        key={idx}
                        className="bg-blue-100 rounded-full px-2 py-1 mr-1 mb-1"
                      >
                        <Text className="text-blue-700 text-xs font-medium">
                          {group}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal mejorado */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => !saving && setModalVisible(false)}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-2xl font-bold text-gray-800">
                  {selectedExercise?.name}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Configura tu máximo personal
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

            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2 text-base">
                Peso Máximo (kg) *
              </Text>
              <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200">
                <TextInput
                  value={maxWeight}
                  onChangeText={setMaxWeight}
                  placeholder="Ej: 100"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="text-gray-800 text-base"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2 text-base">
                Repeticiones (opcional)
              </Text>
              <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200">
                <TextInput
                  value={maxReps}
                  onChangeText={setMaxReps}
                  placeholder="Ej: 5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="text-gray-800 text-base"
                />
              </View>
              <Text className="text-gray-400 text-xs mt-2">
                Número de repeticiones con las que alcanzaste este máximo
              </Text>
            </View>

            <View className="flex-row gap-3">
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
                  <Text className="text-white font-bold text-base">Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
