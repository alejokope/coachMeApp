// Modo entrenamiento mejorado - Elegir día y ejercicio, contador con notificaciones
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  AppState,
  AppStateStatus,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { Routine, RoutineExercise, ExerciseSet } from '../../types';
import { routineService } from '../../services/routineService';
import { commentService } from '../../services/commentService';
import { useAuth } from '../../context/AuthContext';

type StudentStackParamList = {
  StudentHome: undefined;
  Workout: { routineId: string };
};

type WorkoutScreenRouteProp = RouteProp<StudentStackParamList, 'Workout'>;
type WorkoutScreenNavigationProp = NativeStackNavigationProp<
  StudentStackParamList,
  'Workout'
>;

// Configurar notificaciones (solo locales, no push remotas)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  // Ignorar error en Expo Go - las notificaciones locales seguirán funcionando
  console.log('Notification handler configurado (notificaciones locales disponibles)');
}

export default function WorkoutScreen() {
  const route = useRoute<WorkoutScreenRouteProp>();
  const navigation = useNavigation<WorkoutScreenNavigationProp>();
  const { user } = useAuth();
  const { routineId } = route.params;

  const [routine, setRoutine] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<RoutineExercise | null>(null);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [comment, setComment] = useState('');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const notificationIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadRoutine();
    requestNotificationPermissions();
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
      if (notificationIdRef.current) {
        try {
          Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
        } catch (error) {
          // Ignorar error en Expo Go
        }
      }
    };
  }, []);

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        // Solo mostrar alerta si realmente falla, no si es un error de Expo Go
        console.log('Permisos de notificaciones:', status);
      }
    } catch (error) {
      // En Expo Go, las notificaciones push remotas no están disponibles
      // pero las notificaciones locales pueden seguir funcionando
      console.log('Notificaciones locales disponibles (push remotas no disponibles en Expo Go)');
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' && isResting) {
      // Programar notificación cuando la app se minimiza durante descanso
      scheduleRestNotification();
    }
  };

  const scheduleRestNotification = async () => {
    if (restTime > 0) {
      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '¡Descanso terminado!',
            body: 'Ya puedes continuar con tu siguiente serie',
            sound: true,
          },
          trigger: {
            seconds: restTime,
          },
        });
        notificationIdRef.current = notificationId;
      } catch (error) {
        // Las notificaciones locales pueden no funcionar en Expo Go
        // El contador seguirá funcionando en la app
        console.log('Notificación local no disponible (funciona en development build)');
      }
    }
  };

  const loadRoutine = async () => {
    try {
      setLoading(true);
      const found = await routineService.getAssignedRoutineById(routineId);
      if (found) {
        setRoutine(found);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la rutina');
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = (dayNumber: number) => {
    setSelectedDay(dayNumber);
  };

  const selectExercise = (exercise: RoutineExercise) => {
    setSelectedExercise(exercise);
    setCurrentSetIndex(0);
  };

  const startSet = () => {
    if (!selectedExercise) return;
    // El usuario indica que empezó la serie
    // No hacemos nada aquí, solo cuando completa
  };

  const completeSet = async () => {
    if (!selectedExercise) return;

    const set = selectedExercise.sets[currentSetIndex];
    if (!set) return;

    // Marcar serie como completada
    const nextSetIndex = currentSetIndex + 1;
    
    if (nextSetIndex < selectedExercise.sets.length) {
      // Hay más series, iniciar descanso
      const restSeconds = set.restTime || 60; // Default 60 segundos
      startRest(restSeconds);
      setCurrentSetIndex(nextSetIndex);
    } else {
      // Terminó todas las series del ejercicio
      Alert.alert(
        '¡Ejercicio completado!',
        `Has terminado todas las series de ${selectedExercise.exercise?.name || 'este ejercicio'}`,
        [
          {
            text: 'Continuar',
            onPress: () => {
              setSelectedExercise(null);
              setCurrentSetIndex(0);
            },
          },
        ]
      );
    }
  };

  const startRest = (seconds: number) => {
    setRestTime(seconds);
    setIsResting(true);

    // Cancelar notificación anterior si existe
    if (notificationIdRef.current) {
      try {
        Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      } catch (error) {
        // Ignorar error en Expo Go
      }
    }

    // Programar notificación
    scheduleRestNotification();

    // Iniciar contador
    restTimerRef.current = setInterval(() => {
      setRestTime((prev) => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current!);
          setIsResting(false);
          // Enviar notificación inmediata
          try {
            Notifications.scheduleNotificationAsync({
              content: {
                title: '¡Descanso terminado!',
                body: 'Ya puedes continuar con tu siguiente serie',
                sound: true,
              },
              trigger: null, // Inmediato
            });
          } catch (error) {
            // Ignorar error en Expo Go - el contador seguirá funcionando
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const skipRest = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }
    if (notificationIdRef.current) {
      try {
        Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      } catch (error) {
        // Ignorar error en Expo Go
      }
    }
    setIsResting(false);
    setRestTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addComment = async () => {
    if (!comment.trim() || !selectedExercise || !user) return;

    try {
      await commentService.createComment({
        routineId,
        exerciseId: selectedExercise.exerciseId,
        userId: user.id,
        comment: comment.trim(),
      });
      Alert.alert('Éxito', 'Comentario agregado');
      setComment('');
      setCommentModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el comentario');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (!routine) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-500">No se pudo cargar la rutina</Text>
      </View>
    );
  }

  // Pantalla 1: Seleccionar día
  if (!selectedDay) {
    return (
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Seleccionar Día
          </Text>
          <Text className="text-gray-600 mb-6">
            Elige el día de la rutina que vas a entrenar
          </Text>

          {routine.days.map((day: any) => (
            <TouchableOpacity
              key={day.dayNumber}
              onPress={() => startWorkout(day.dayNumber)}
              className="bg-white rounded-2xl p-6 mb-4 shadow-sm"
              activeOpacity={0.7}
            >
              <Text className="text-xl font-bold text-gray-800 mb-1">
                Día {day.dayNumber}
                {day.name && ` - ${day.name}`}
              </Text>
              <Text className="text-gray-600">
                {day.exercises.length} {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  const currentDay = routine.days.find((d: any) => d.dayNumber === selectedDay);

  // Pantalla 2: Seleccionar ejercicio (si no hay uno seleccionado)
  if (!selectedExercise) {
    return (
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-2xl font-bold text-gray-800">
                Día {selectedDay}
              </Text>
              <Text className="text-gray-600">
                Elige el ejercicio que vas a realizar
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedDay(null)}
              className="bg-gray-200 rounded-xl px-4 py-2"
            >
              <Text className="text-gray-700 font-semibold">Cambiar Día</Text>
            </TouchableOpacity>
          </View>

          {currentDay?.exercises.map((exercise: RoutineExercise, index: number) => (
            <TouchableOpacity
              key={exercise.id || index}
              onPress={() => selectExercise(exercise)}
              className="bg-white rounded-2xl p-6 mb-4 shadow-sm"
              activeOpacity={0.7}
            >
              <Text className="text-xl font-bold text-gray-800 mb-2">
                {exercise.exercise?.name || `Ejercicio ${index + 1}`}
              </Text>
              <Text className="text-gray-600">
                {exercise.sets.length} {exercise.sets.length === 1 ? 'serie' : 'series'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // Pantalla 3: Modo entrenamiento activo
  const currentSet = selectedExercise.sets[currentSetIndex];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-amber-600 px-6 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white font-bold text-lg">
              {selectedExercise.exercise?.name || 'Ejercicio'}
            </Text>
            <Text className="text-amber-100 text-sm">
              Serie {currentSetIndex + 1} de {selectedExercise.sets.length}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Finalizar Ejercicio',
                '¿Quieres cambiar de ejercicio?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Cambiar',
                    onPress: () => {
                      setSelectedExercise(null);
                      setCurrentSetIndex(0);
                      setIsResting(false);
                      setRestTime(0);
                      if (restTimerRef.current) {
                        clearInterval(restTimerRef.current);
                      }
                    },
                  },
                ]
              );
            }}
            className="bg-white/20 rounded-xl px-4 py-2"
          >
            <Text className="text-white font-semibold">Cambiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Información de la serie actual */}
        <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Serie {currentSetIndex + 1}
          </Text>
          
          <View className="space-y-3">
            {currentSet.repetitions && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Repeticiones:</Text>
                <Text className="font-semibold text-gray-800">
                  {currentSet.repetitions}
                </Text>
              </View>
            )}
            {currentSet.weight && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Peso:</Text>
                <Text className="font-semibold text-gray-800">
                  {currentSet.weight} kg
                </Text>
              </View>
            )}
            {currentSet.loadPercentage && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">% Carga:</Text>
                <Text className="font-semibold text-gray-800">
                  {currentSet.loadPercentage}%
                </Text>
              </View>
            )}
            {currentSet.rir !== undefined && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">RIR:</Text>
                <Text className="font-semibold text-gray-800">
                  {currentSet.rir}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Contador de descanso */}
        {isResting && (
          <View className="bg-blue-50 rounded-2xl p-6 mb-4 border-2 border-blue-200">
            <Text className="text-center text-gray-600 mb-2">Descanso</Text>
            <Text className="text-center text-5xl font-bold text-blue-600 mb-4">
              {formatTime(restTime)}
            </Text>
            <TouchableOpacity
              onPress={skipRest}
              className="bg-blue-600 rounded-xl py-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold">Saltar Descanso</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botones de acción */}
        {!isResting && (
          <View className="space-y-3">
            <TouchableOpacity
              onPress={completeSet}
              className="bg-green-600 rounded-xl py-4 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">
                Completar Serie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCommentModalVisible(true)}
              className="bg-gray-200 rounded-xl py-4 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-gray-700 font-semibold">
                💬 Agregar Comentario
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal de comentario */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Agregar Comentario
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Escribe tu comentario..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800 mb-4"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setCommentModalVisible(false);
                  setComment('');
                }}
                className="flex-1 bg-gray-200 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-700 font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addComment}
                className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
