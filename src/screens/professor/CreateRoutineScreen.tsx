// Pantalla de creación de rutina mejorada y profesional
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Routine, RoutineDay, RoutineExercise, ExerciseSet, Exercise } from '../../types';
import { routineService } from '../../services/routineService';
import { exerciseService } from '../../services/exerciseService';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function CreateRoutineScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [routineName, setRoutineName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTemplate, setIsTemplate] = useState(user?.userType !== 'person');

  useEffect(() => {
    loadExercises();
  }, []);

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [searchingExercises, setSearchingExercises] = useState(false);

  useEffect(() => {
    // Búsqueda en tiempo real con debounce
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (exerciseSearchQuery.trim()) {
      const timeout = setTimeout(async () => {
        await performExerciseSearch();
      }, 500);
      setSearchTimeout(timeout);
    } else {
      setFilteredExercises(exercises);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [exerciseSearchQuery]);

  const performExerciseSearch = async () => {
    if (!exerciseSearchQuery.trim()) {
      setFilteredExercises(exercises);
      return;
    }

    try {
      setSearchingExercises(true);
      const gymId = (user as any)?.gymId;
      const results = await exerciseService.searchExercises(exerciseSearchQuery, gymId);
      setFilteredExercises(results);
    } catch (error) {
      Alert.alert('Error', 'No se pudo realizar la búsqueda');
      setFilteredExercises(exercises);
    } finally {
      setSearchingExercises(false);
    }
  };

  const loadExercises = async () => {
    try {
      setLoadingExercises(true);
      const gymId = (user as any)?.gymId;
      const data = await exerciseService.getAllExercises(gymId);
      setExercises(data);
      setFilteredExercises(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los ejercicios');
    } finally {
      setLoadingExercises(false);
    }
  };

  const addDay = () => {
    const newDay: RoutineDay = {
      id: `day-${Date.now()}`,
      dayNumber: days.length + 1,
      name: `Día ${days.length + 1}`,
      exercises: [],
    };
    setDays([...days, newDay]);
  };

  const removeDay = (dayId: string) => {
    setDays(days.filter((d) => d.id !== dayId));
  };

  const openExerciseModal = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setSelectedExercise(null);
    setSets([]);
    setExerciseSearchQuery('');
    setExerciseModalVisible(true);
  };

  const updateSet = (
    setId: string,
    field: keyof ExerciseSet,
    value: any
  ) => {
    setSets(
      sets.map((set) =>
        set.id === setId ? { ...set, [field]: value } : set
      )
    );
  };

  const addSet = () => {
    const newSet: ExerciseSet = {
      id: `set-${Date.now()}`,
      repetitions: 10,
      weight: 0,
    };
    setSets([...sets, newSet]);
  };

  const removeSet = (setId: string) => {
    setSets(sets.filter((s) => s.id !== setId));
  };

  const addExerciseToDay = () => {
    if (!selectedExercise || !selectedDay || sets.length === 0) {
      Alert.alert('Error', 'Selecciona un ejercicio y configura al menos una serie');
      return;
    }

    const day = days.find((d) => d.dayNumber === selectedDay);
    if (!day) return;

    const routineExercise: RoutineExercise = {
      id: `exercise-${Date.now()}`,
      exerciseId: selectedExercise.id,
      exercise: selectedExercise,
      sets: sets,
      order: day.exercises.length + 1,
    };

    const updatedDays = days.map((d) =>
      d.id === day.id
        ? { ...d, exercises: [...d.exercises, routineExercise] }
        : d
    );

    setDays(updatedDays);
    setExerciseModalVisible(false);
    setSelectedExercise(null);
    setSets([]);
    setSelectedDay(null);
  };

  const removeExerciseFromDay = (dayId: string, exerciseId: string) => {
    const updatedDays = days.map((d) =>
      d.id === dayId
        ? {
            ...d,
            exercises: d.exercises.filter((e) => e.id !== exerciseId),
          }
        : d
    );
    setDays(updatedDays);
  };

  const handleSave = async () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'El nombre de la rutina es obligatorio');
      return;
    }

    if (days.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos un día');
      return;
    }

    try {
      setSaving(true);
      await routineService.createRoutine({
        name: routineName,
        description: description || undefined,
        professorId: user?.id || '',
        gymId: (user as any)?.gymId || undefined,
        days,
        isTemplate: user?.userType !== 'person', // Profesores crean plantillas, personas no
      });

      Alert.alert('Éxito', 'Rutina creada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la rutina');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#10B981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-12 pb-6"
      >
        <Text className="text-3xl font-bold text-white mb-2">
          Crear Rutina
        </Text>
        <Text className="text-green-100 text-sm">
          {isTemplate ? 'Crea una plantilla para tus alumnos' : 'Crea tu rutina personal'}
        </Text>
      </LinearGradient>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Información básica */}
        <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Información Básica
          </Text>

          <View className="mb-5">
            <Text className="text-gray-700 font-semibold mb-2 text-base">
              Nombre de la Rutina *
            </Text>
            <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200">
              <TextInput
                value={routineName}
                onChangeText={setRoutineName}
                placeholder="Ej: Rutina de Fuerza Semanal"
                placeholderTextColor="#9CA3AF"
                className="text-gray-800 text-base"
                autoComplete="off"
                textContentType="none"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2 text-base">
              Descripción
            </Text>
            <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200 min-h-[100px]">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe el objetivo de esta rutina..."
                placeholderTextColor="#9CA3AF"
                multiline
                autoComplete="off"
                textContentType="none"
                numberOfLines={4}
                className="text-gray-800 text-base"
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Días */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-xl font-bold text-gray-800">
                Días de la Rutina
              </Text>
              <Text className="text-gray-500 text-sm">
                {days.length} {days.length === 1 ? 'día' : 'días'} agregados
              </Text>
            </View>
            <TouchableOpacity
              onPress={addDay}
              className="bg-green-600 rounded-2xl px-5 py-3 flex-row items-center"
              activeOpacity={0.8}
              style={{
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Ionicons name="add" size={20} color="white" style={{ marginRight: 6 }} />
              <Text className="text-white font-bold">Agregar Día</Text>
            </TouchableOpacity>
          </View>

          {days.length === 0 ? (
            <View className="bg-white rounded-3xl p-12 items-center shadow-sm">
              <View className="bg-green-100 rounded-full w-20 h-20 items-center justify-center mb-4">
                <Ionicons name="calendar-outline" size={40} color="#10B981" />
              </View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                No hay días agregados
              </Text>
              <Text className="text-gray-500 text-center mb-6">
                Agrega el primer día para comenzar a crear tu rutina
              </Text>
              <TouchableOpacity
                onPress={addDay}
                className="bg-green-600 rounded-xl px-6 py-3"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold">Agregar Primer Día</Text>
              </TouchableOpacity>
            </View>
          ) : (
            days.map((day) => (
              <View
                key={day.id}
                className="bg-white rounded-3xl p-6 mb-4 shadow-sm"
              >
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800 mb-1">
                      {day.name}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {day.exercises.length} {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                    </Text>
                  </View>
                  {days.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeDay(day.id)}
                      className="bg-red-100 rounded-xl px-4 py-2"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => openExerciseModal(day.dayNumber)}
                  className="bg-green-50 rounded-2xl py-4 items-center mb-4 border-2 border-green-200 border-dashed"
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#10B981" style={{ marginBottom: 4 }} />
                  <Text className="text-green-700 font-semibold text-base">
                    Agregar Ejercicio
                  </Text>
                </TouchableOpacity>

                {day.exercises.map((exercise) => (
                  <View
                    key={exercise.id}
                    className="bg-gray-50 rounded-2xl p-4 mb-3 flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="font-bold text-gray-800 mb-1">
                        {exercise.exercise?.name || 'Ejercicio'}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {exercise.sets.length} {exercise.sets.length === 1 ? 'serie' : 'series'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeExerciseFromDay(day.id, exercise.id)}
                      className="bg-red-100 rounded-xl px-4 py-2"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl py-5 items-center mb-6 shadow-lg"
          activeOpacity={0.8}
          style={{
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={24} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold text-lg">
                Guardar Rutina
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de selección de ejercicio mejorado */}
      <Modal
        visible={exerciseModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setExerciseModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-2xl font-bold text-gray-800">
                  Seleccionar Ejercicio
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Busca y selecciona un ejercicio de la base de datos
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setExerciseModalVisible(false)}
                className="bg-gray-100 rounded-full w-10 h-10 items-center justify-center"
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Búsqueda de ejercicios mejorada */}
            <View className="mb-4">
              <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200 flex-row items-center">
                {searchingExercises ? (
                  <ActivityIndicator size="small" color="#10B981" style={{ marginRight: 10 }} />
                ) : (
                  <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
                )}
                <TextInput
                  value={exerciseSearchQuery}
                  onChangeText={setExerciseSearchQuery}
                  placeholder="Buscar en la base de datos..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 text-gray-800 text-base"
                  autoFocus
                  autoComplete="off"
                  textContentType="none"
                />
                {exerciseSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setExerciseSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
              {exerciseSearchQuery && (
                <Text className="text-gray-500 text-xs mt-2 ml-2">
                  Buscando en la base de datos...
                </Text>
              )}
            </View>

            {loadingExercises ? (
              <View className="py-16 items-center">
                <ActivityIndicator size="large" color="#10B981" />
                <Text className="text-gray-600 mt-4 text-base font-medium">
                  Cargando ejercicios...
                </Text>
              </View>
            ) : (
              <>
                <ScrollView className="max-h-96 mb-4" showsVerticalScrollIndicator={false}>
                  {filteredExercises.length === 0 ? (
                    <View className="py-16 items-center">
                      <View className="bg-gray-100 rounded-full w-16 h-16 items-center justify-center mb-4">
                        <Ionicons name="fitness-outline" size={32} color="#9CA3AF" />
                      </View>
                      <Text className="text-gray-600 text-center text-base font-medium mb-2">
                        {exerciseSearchQuery
                          ? 'No se encontraron ejercicios'
                          : 'No hay ejercicios disponibles'}
                      </Text>
                      <Text className="text-gray-400 text-center text-sm">
                        {exerciseSearchQuery
                          ? 'Intenta con otro término de búsqueda'
                          : 'Los ejercicios se cargan desde la base de datos'}
                      </Text>
                    </View>
                  ) : (
                    filteredExercises.map((exercise) => (
                      <TouchableOpacity
                        key={exercise.id}
                        onPress={() => {
                          setSelectedExercise(exercise);
                          setSets([{ id: `set-${Date.now()}`, repetitions: 10, weight: 0 }]);
                        }}
                        className={`rounded-2xl p-4 mb-3 border-2 ${
                          selectedExercise?.id === exercise.id
                            ? 'bg-green-50 border-green-500'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        activeOpacity={0.7}
                      >
                        <View className="flex-row items-start">
                          <LinearGradient
                            colors={selectedExercise?.id === exercise.id ? ['#10B981', '#059669'] : ['#3B82F6', '#2563EB']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="w-14 h-14 rounded-xl items-center justify-center mr-3"
                          >
                            {exercise.videoUrl ? (
                              <Ionicons name="videocam" size={24} color="white" />
                            ) : (
                              <Text className="text-white text-lg font-bold">
                                {exercise.name.charAt(0).toUpperCase()}
                              </Text>
                            )}
                          </LinearGradient>
                          <View className="flex-1">
                            <Text className="font-bold text-gray-800 mb-1 text-base">
                              {exercise.name}
                            </Text>
                            {exercise.description && (
                              <Text className="text-gray-500 text-xs mb-2" numberOfLines={1}>
                                {exercise.description}
                              </Text>
                            )}
                            <View className="flex-row flex-wrap">
                              {(exercise.muscleGroups || []).slice(0, 3).map((group, idx) => (
                                <View
                                  key={idx}
                                  className="bg-blue-100 rounded-full px-2 py-1 mr-1 mb-1"
                                >
                                  <Text className="text-blue-700 text-xs font-medium">
                                    {group}
                                  </Text>
                                </View>
                              ))}
                              {(exercise.muscleGroups || []).length > 3 && (
                                <View className="bg-gray-100 rounded-full px-2 py-1 mr-1 mb-1">
                                  <Text className="text-gray-600 text-xs font-medium">
                                    +{(exercise.muscleGroups || []).length - 3}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          {selectedExercise?.id === exercise.id && (
                            <View className="bg-green-600 rounded-full w-7 h-7 items-center justify-center">
                              <Ionicons name="checkmark" size={18} color="white" />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>

                {selectedExercise && (
                  <View className="bg-green-50 rounded-2xl p-5 mb-4 border-2 border-green-200">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-lg font-bold text-gray-800">
                        Configurar Series - {selectedExercise.name}
                      </Text>
                      <TouchableOpacity
                        onPress={addSet}
                        className="bg-green-600 rounded-xl px-3 py-2"
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={18} color="white" />
                      </TouchableOpacity>
                    </View>
                    {sets.map((set, index) => (
                      <View
                        key={set.id}
                        className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
                      >
                        <View className="flex-row items-center justify-between mb-3">
                          <Text className="text-gray-700 font-semibold">
                            Serie {index + 1}
                          </Text>
                          {sets.length > 1 && (
                            <TouchableOpacity
                              onPress={() => removeSet(set.id)}
                              className="bg-red-100 rounded-lg px-3 py-1"
                            >
                              <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                        <View className="flex-row gap-3 mb-3">
                          <View className="flex-1">
                            <Text className="text-gray-600 text-xs mb-2 font-medium">Repeticiones</Text>
                            <TextInput
                              value={set.repetitions?.toString() || ''}
                              onChangeText={(text) =>
                                updateSet(set.id, 'repetitions', parseInt(text) || 0)
                              }
                              keyboardType="numeric"
                              placeholder="10"
                              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800 border border-gray-200"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-600 text-xs mb-2 font-medium">Peso (kg)</Text>
                            <TextInput
                              value={set.weight?.toString() || ''}
                              onChangeText={(text) =>
                                updateSet(set.id, 'weight', parseFloat(text) || 0)
                              }
                              keyboardType="numeric"
                              placeholder="0"
                              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800 border border-gray-200"
                            />
                          </View>
                        </View>
                        <View className="flex-row gap-3">
                          <View className="flex-1">
                            <Text className="text-gray-600 text-xs mb-2 font-medium">% Carga</Text>
                            <TextInput
                              value={set.loadPercentage?.toString() || ''}
                              onChangeText={(text) =>
                                updateSet(set.id, 'loadPercentage', parseFloat(text) || undefined)
                              }
                              keyboardType="numeric"
                              placeholder="80"
                              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800 border border-gray-200"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-600 text-xs mb-2 font-medium">RIR</Text>
                            <TextInput
                              value={set.rir?.toString() || ''}
                              onChangeText={(text) =>
                                updateSet(set.id, 'rir', parseInt(text) || undefined)
                              }
                              keyboardType="numeric"
                              placeholder="2"
                              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800 border border-gray-200"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-600 text-xs mb-2 font-medium">Descanso (seg)</Text>
                            <TextInput
                              value={set.restTime?.toString() || ''}
                              onChangeText={(text) =>
                                updateSet(set.id, 'restTime', parseInt(text) || undefined)
                              }
                              keyboardType="numeric"
                              placeholder="60"
                              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800 border border-gray-200"
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                    <TouchableOpacity
                      onPress={addExerciseToDay}
                      className="bg-green-600 rounded-xl py-4 items-center"
                      activeOpacity={0.8}
                    >
                      <Text className="text-white font-bold text-base">
                        Agregar a Rutina
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
