// Modo entrenamiento mejorado - Paso a paso con checks, temporizador y registro de pesos
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  AppState,
  AppStateStatus,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { Routine, RoutineExercise, ExerciseSet, WorkoutSetRecord, WorkoutExerciseRecord } from '../../types';
import { routineService } from '../../services/routineService';
import { personalMaxService } from '../../services/personalMaxService';
import { workoutHistoryService } from '../../services/workoutHistoryService';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import Toast from '../../components/Toast';
import Loading from '../../components/Loading';
import LoadingScreen from '../../components/LoadingScreen';

type StudentStackParamList = {
  StudentHome: undefined;
  Workout: { routineId: string; isPersonal?: boolean };
};

type WorkoutScreenRouteProp = RouteProp<StudentStackParamList, 'Workout'>;
type WorkoutScreenNavigationProp = NativeStackNavigationProp<
  StudentStackParamList,
  'Workout'
>;

// Configurar notificaciones
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  console.log('Notification handler configurado');
}

export default function WorkoutScreen() {
  const route = useRoute<WorkoutScreenRouteProp>();
  const navigation = useNavigation<WorkoutScreenNavigationProp>();
  const { user } = useAuth();
  const { routineId, isPersonal } = route.params;

  // Estados principales
  const [routine, setRoutine] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<RoutineExercise | null>(null);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingMax, setLoadingMax] = useState(false);
  
  // Temporizador
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const notificationIdRef = useRef<string | null>(null);
  
  // Peso máximo y datos del ejercicio
  const [personalMax, setPersonalMax] = useState<number | null>(null);
  const [weightUsed, setWeightUsed] = useState<string>('');
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  
  // Historial de entrenamiento
  const [workoutSession, setWorkoutSession] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [exerciseRecords, setExerciseRecords] = useState<Map<string, WorkoutExerciseRecord>>(new Map());
  
  // Toast
  const [toast, setToast] = useState<{ visible: boolean; message: string; type?: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  };

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
          // Ignorar error
        }
      }
    };
  }, []);

  useEffect(() => {
    if (selectedExercise?.exerciseId && user?.id) {
      loadPersonalMax();
    }
  }, [selectedExercise?.exerciseId, user?.id]);

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Permisos de notificaciones:', status);
    } catch (error) {
      console.log('Notificaciones locales disponibles');
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' && isResting) {
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
        console.log('Notificación local no disponible');
      }
    }
  };

  const loadRoutine = async () => {
    try {
      setLoading(true);
      let found = null;
      
      if (isPersonal) {
        found = await routineService.getRoutineById(routineId);
      } else {
        found = await routineService.getAssignedRoutineById(routineId);
      }
      
      if (found) {
        setRoutine(found);
      } else {
        showToast('No se pudo cargar la rutina', 'error');
      }
    } catch (error) {
      console.error('Error loading routine:', error);
      showToast('Error al cargar la rutina', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalMax = async () => {
    if (!selectedExercise?.exerciseId || !user?.id) return;
    
    try {
      setLoadingMax(true);
      const max = await personalMaxService.getExerciseMax(user.id, selectedExercise.exerciseId);
      setPersonalMax(max?.maxWeight || null);
    } catch (error) {
      console.error('Error loading personal max:', error);
    } finally {
      setLoadingMax(false);
    }
  };

  const startWorkout = async (dayNumber: number) => {
    if (!routine || !user || saving) return;
    
    try {
      setSaving(true);
      // Crear sesión de entrenamiento
      const currentDay = routine.days.find((d: any) => d.dayNumber === dayNumber);
      if (!currentDay) {
        setSaving(false);
        return;
      }

      const session = await workoutHistoryService.createWorkoutSession({
        userId: user.id,
        routineId: routine.id,
        routineName: routine.name,
        dayNumber: dayNumber,
        dayName: currentDay.name,
        exercises: [],
        completed: false,
      });
      
      setWorkoutSession(session.id);
      setSelectedDay(dayNumber);
      showToast('¡Entrenamiento iniciado!', 'success');
    } catch (error) {
      console.error('Error starting workout:', error);
      showToast('Error al iniciar entrenamiento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectExercise = (exercise: RoutineExercise) => {
    setSelectedExercise(exercise);
    setCurrentSetIndex(0);
    setWeightUsed('');
  };

  const calculateWeightFromPercentage = (percentage?: number): number | null => {
    if (!percentage || !personalMax) return null;
    return Math.round((personalMax * percentage) / 100);
  };

  const getCurrentSet = (): ExerciseSet | null => {
    if (!selectedExercise) return null;
    return selectedExercise.sets[currentSetIndex] || null;
  };

  const completeSet = async () => {
    if (!selectedExercise || !getCurrentSet() || !user || saving) return;

    try {
      setSaving(true);
      const set = getCurrentSet()!;
      const finalWeight = weightUsed ? parseFloat(weightUsed) : (set.weight || calculateWeightFromPercentage(set.loadPercentage) || 0);

      // Registrar serie completada
      const exerciseId = selectedExercise.exerciseId;
      const existingRecord = exerciseRecords.get(exerciseId);
      
      const setRecord: WorkoutSetRecord = {
        setId: set.id,
        exerciseId: exerciseId,
        repetitions: set.repetitions,
        weight: finalWeight,
        completed: true,
        completedAt: new Date(),
      };

      const updatedRecord: WorkoutExerciseRecord = existingRecord || {
        exerciseId: exerciseId,
        exerciseName: selectedExercise.exercise?.name || 'Ejercicio',
        sets: [],
        completed: false,
      };

      updatedRecord.sets.push(setRecord);
      setExerciseRecords(new Map(exerciseRecords.set(exerciseId, updatedRecord)));

      // Limpiar peso usado
      setWeightUsed('');

      const nextSetIndex = currentSetIndex + 1;
      
      if (nextSetIndex < selectedExercise.sets.length) {
        // Hay más series, iniciar descanso
        const restSeconds = set.restTime || 60;
        startRest(restSeconds);
        setCurrentSetIndex(nextSetIndex);
        showToast(`Serie ${currentSetIndex + 1} completada`, 'success');
      } else {
        // Terminó todas las series del ejercicio
        updatedRecord.completed = true;
        updatedRecord.completedAt = new Date();
        setExerciseRecords(new Map(exerciseRecords.set(exerciseId, updatedRecord)));
        setCompletedExercises(new Set(completedExercises).add(exerciseId));
        
        showToast(`¡${selectedExercise.exercise?.name || 'Ejercicio'} completado!`, 'success');
        
        // Actualizar sesión de entrenamiento
        if (workoutSession) {
          const allRecords = Array.from(exerciseRecords.values());
          allRecords.push(updatedRecord);
          
          try {
            await workoutHistoryService.updateWorkoutSession(workoutSession, {
              exercises: allRecords,
            });
          } catch (error) {
            console.error('Error updating workout session:', error);
          }
        }
        
        // Volver a selección de ejercicios
        setTimeout(() => {
          setSelectedExercise(null);
          setCurrentSetIndex(0);
        }, 1500);
      }
    } finally {
      setSaving(false);
    }
  };

  const startRest = (seconds: number) => {
    setRestTime(seconds);
    setIsResting(true);

    if (notificationIdRef.current) {
      try {
        Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      } catch (error) {
        // Ignorar
      }
    }

    scheduleRestNotification();

    restTimerRef.current = setInterval(() => {
      setRestTime((prev) => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current!);
          setIsResting(false);
          try {
            Notifications.scheduleNotificationAsync({
              content: {
                title: '¡Descanso terminado!',
                body: 'Ya puedes continuar con tu siguiente serie',
                sound: true,
              },
              trigger: null,
            });
          } catch (error) {
            // Ignorar
          }
          showToast('¡Descanso terminado!', 'success');
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
        // Ignorar
      }
    }
    setIsResting(false);
    setRestTime(0);
    showToast('Descanso saltado', 'info');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const finishWorkout = async () => {
    if (!workoutSession || saving) return;

    try {
      setSaving(true);
      const allRecords = Array.from(exerciseRecords.values());
      await workoutHistoryService.updateWorkoutSession(workoutSession, {
        exercises: allRecords,
        completed: true,
        endTime: new Date(),
      });
      
      showToast('¡Entrenamiento completado!', 'success');
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error finishing workout:', error);
      showToast('Error al finalizar entrenamiento', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando rutina..." color={theme.primary.main} icon="fitness-outline" />;
  }

  if (!routine) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar la rutina</Text>
      </View>
    );
  }

  // Pantalla 1: Seleccionar día
  if (!selectedDay) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Selecciona el día</Text>
          <Text style={styles.sectionSubtitle}>Elige el día de la rutina que vas a entrenar</Text>

          {routine.days.map((day: any) => (
            <TouchableOpacity
              key={day.dayNumber}
              onPress={() => startWorkout(day.dayNumber)}
              style={styles.dayCard}
              activeOpacity={0.7}
              disabled={saving}
            >
              <View style={styles.dayCardContent}>
                <View style={styles.dayCardHeader}>
                  <Text style={styles.dayCardNumber}>Día {day.dayNumber}</Text>
                  {day.name && <Text style={styles.dayCardName}>{day.name}</Text>}
                </View>
                <Text style={styles.dayCardExercises}>
                  {day.exercises.length} ejercicio{day.exercises.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.text.tertiary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />
      </View>
    );
  }

  const currentDay = routine.days.find((d: any) => d.dayNumber === selectedDay);

  // Pantalla 2: Seleccionar ejercicio
  if (!selectedExercise) {
    const allExercisesCompleted = currentDay?.exercises.every((ex: RoutineExercise) =>
      completedExercises.has(ex.exerciseId)
    );

    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.dayInfo}>
            <Text style={styles.dayInfoTitle}>{currentDay?.name || `Día ${selectedDay}`}</Text>
            <TouchableOpacity
              onPress={() => setSelectedDay(null)}
              style={styles.changeDayButton}
            >
              <Text style={styles.changeDayButtonText}>Cambiar Día</Text>
            </TouchableOpacity>
          </View>

          {currentDay?.exercises.map((exercise: RoutineExercise, index: number) => {
            const isCompleted = completedExercises.has(exercise.exerciseId);
            return (
              <TouchableOpacity
                key={exercise.id || index}
                onPress={() => selectExercise(exercise)}
                style={[styles.exerciseCard, isCompleted && styles.exerciseCardCompleted]}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseCardContent}>
                  <View style={styles.exerciseCardHeader}>
                    <Text style={styles.exerciseCardName}>
                      {exercise.exercise?.name || `Ejercicio ${index + 1}`}
                    </Text>
                    {isCompleted && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={24} color={theme.accent.success} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.exerciseCardSets}>
                    {exercise.sets.length} serie{exercise.sets.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={theme.text.tertiary} />
              </TouchableOpacity>
            );
          })}

          {allExercisesCompleted && (
            <TouchableOpacity
              onPress={finishWorkout}
              style={styles.finishButton}
              activeOpacity={0.8}
              disabled={saving}
            >
              <LinearGradient
                colors={theme.gradients.primary}
                style={styles.finishButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color={theme.text.white} />
                <Text style={styles.finishButtonText}>Finalizar Entrenamiento</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />
      </View>
    );
  }

  // Pantalla 3: Modo entrenamiento activo
  const currentSet = getCurrentSet();
  if (!currentSet) return null;

  const plannedWeight = currentSet.weight || calculateWeightFromPercentage(currentSet.loadPercentage);
  const displayWeight = weightUsed || plannedWeight?.toString() || '0';

  return (
    <View style={styles.container}>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info de la serie */}
        <View style={styles.setInfoCard}>
          <View style={styles.setInfoHeader}>
            <Text style={styles.setInfoTitle}>
              Serie {currentSetIndex + 1} de {selectedExercise.sets.length}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentSetIndex + 1) / selectedExercise.sets.length) * 100}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.setInfoGrid}>
            {currentSet.repetitions && (
              <View style={styles.setInfoItem}>
                <Text style={styles.setInfoLabel}>Repeticiones</Text>
                <Text style={styles.setInfoValue}>{currentSet.repetitions}</Text>
              </View>
            )}
            
            {plannedWeight && (
              <View style={styles.setInfoItem}>
                <Text style={styles.setInfoLabel}>Peso Planificado</Text>
                <Text style={styles.setInfoValue}>{plannedWeight} kg</Text>
              </View>
            )}
            
            {currentSet.loadPercentage && (
              <View style={styles.setInfoItem}>
                <Text style={styles.setInfoLabel}>% de Carga</Text>
                <Text style={styles.setInfoValue}>{currentSet.loadPercentage}%</Text>
              </View>
            )}
            
            {personalMax && (
              <View style={styles.setInfoItem}>
                <Text style={styles.setInfoLabel}>Peso Máximo</Text>
                <Text style={styles.setInfoValue}>{personalMax} kg</Text>
              </View>
            )}
            
            {currentSet.rir !== undefined && (
              <View style={styles.setInfoItem}>
                <Text style={styles.setInfoLabel}>RIR</Text>
                <Text style={styles.setInfoValue}>{currentSet.rir}</Text>
              </View>
            )}
            
            {currentSet.restTime && (
              <View style={styles.setInfoItem}>
                <Text style={styles.setInfoLabel}>Descanso</Text>
                <Text style={styles.setInfoValue}>{formatTime(currentSet.restTime)}</Text>
              </View>
            )}
          </View>

          {/* Input de peso usado */}
          <TouchableOpacity
            onPress={() => setWeightModalVisible(true)}
            style={styles.weightInputButton}
            activeOpacity={0.7}
          >
            <View style={styles.weightInputContent}>
              <Ionicons name="barbell" size={20} color={theme.primary.main} />
              <Text style={styles.weightInputLabel}>Peso usado:</Text>
              <Text style={styles.weightInputValue}>
                {displayWeight} kg
              </Text>
              <Ionicons name="pencil" size={16} color={theme.text.tertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Contador de descanso */}
        {isResting && (
          <View style={styles.restCard}>
            <Text style={styles.restTitle}>Descanso</Text>
            <Text style={styles.restTime}>{formatTime(restTime)}</Text>
            <TouchableOpacity
              onPress={skipRest}
              style={styles.skipRestButton}
              activeOpacity={0.8}
            >
              <Text style={styles.skipRestButtonText}>Saltar Descanso</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botón completar serie */}
        {!isResting && (
          <TouchableOpacity
            onPress={completeSet}
            style={styles.completeButton}
            activeOpacity={0.8}
            disabled={saving}
          >
            <LinearGradient
              colors={theme.gradients.primary}
              style={styles.completeButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color={theme.text.white} />
              <Text style={styles.completeButtonText}>Completar Serie</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Botón cambiar ejercicio */}
        <TouchableOpacity
          onPress={() => {
            setSelectedExercise(null);
            setCurrentSetIndex(0);
            setWeightUsed('');
          }}
          style={styles.changeExerciseButton}
        >
          <Text style={styles.changeExerciseButtonText}>Cambiar Ejercicio</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de peso usado */}
      <Modal
        visible={weightModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWeightModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Peso Usado</Text>
            <Text style={styles.modalSubtitle}>
              {plannedWeight && `Planificado: ${plannedWeight} kg`}
            </Text>
            <TextInput
              value={weightUsed}
              onChangeText={setWeightUsed}
              placeholder="0"
              keyboardType="numeric"
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setWeightModalVisible(false);
                  setWeightUsed('');
                }}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setWeightModalVisible(false)}
                style={styles.modalConfirmButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={theme.gradients.primary}
                  style={styles.modalConfirmButtonGradient}
                >
                  <Text style={styles.modalConfirmButtonText}>Confirmar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Loading visible={saving || loadingMax} message={saving ? "Guardando..." : "Cargando datos..."} />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.text.secondary,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.text.primary,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    ...theme.typography.body,
    color: theme.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  dayCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCardContent: {
    flex: 1,
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  dayCardNumber: {
    ...theme.typography.h3,
    color: theme.text.primary,
    marginRight: theme.spacing.sm,
  },
  dayCardName: {
    ...theme.typography.body,
    color: theme.text.secondary,
  },
  dayCardExercises: {
    ...theme.typography.caption,
    color: theme.text.tertiary,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  dayInfoTitle: {
    ...theme.typography.h2,
    color: theme.text.primary,
  },
  changeDayButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.background.tertiary,
    borderRadius: theme.borderRadius.md,
  },
  changeDayButtonText: {
    ...theme.typography.caption,
    color: theme.primary.main,
    fontWeight: '600',
  },
  exerciseCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseCardCompleted: {
    borderWidth: 2,
    borderColor: theme.accent.success,
  },
  exerciseCardContent: {
    flex: 1,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  exerciseCardName: {
    ...theme.typography.h3,
    color: theme.text.primary,
    flex: 1,
  },
  checkBadge: {
    marginLeft: theme.spacing.sm,
  },
  exerciseCardSets: {
    ...theme.typography.caption,
    color: theme.text.secondary,
  },
  finishButton: {
    marginTop: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  finishButtonGradient: {
    padding: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonText: {
    ...theme.typography.h3,
    color: theme.text.white,
    marginLeft: theme.spacing.sm,
  },
  setInfoCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  setInfoHeader: {
    marginBottom: theme.spacing.lg,
  },
  setInfoTitle: {
    ...theme.typography.h3,
    color: theme.text.primary,
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.primary.main,
    borderRadius: 3,
  },
  setInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
  },
  setInfoItem: {
    width: '50%',
    marginBottom: theme.spacing.md,
  },
  setInfoLabel: {
    ...theme.typography.caption,
    color: theme.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  setInfoValue: {
    ...theme.typography.h3,
    color: theme.text.primary,
  },
  weightInputButton: {
    backgroundColor: theme.iconBackground.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.primary.main,
    borderStyle: 'dashed',
  },
  weightInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInputLabel: {
    ...theme.typography.body,
    color: theme.text.secondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  weightInputValue: {
    ...theme.typography.h3,
    color: theme.primary.main,
    fontWeight: '700',
    marginRight: theme.spacing.sm,
  },
  restCard: {
    backgroundColor: theme.iconBackground.tertiary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxxl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.primary.main,
  },
  restTitle: {
    ...theme.typography.body,
    color: theme.text.secondary,
    marginBottom: theme.spacing.md,
  },
  restTime: {
    fontSize: 64,
    fontWeight: '800',
    color: theme.primary.main,
    marginBottom: theme.spacing.xl,
  },
  skipRestButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.lg,
  },
  skipRestButtonText: {
    ...theme.typography.body,
    color: theme.primary.main,
    fontWeight: '600',
  },
  completeButton: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    padding: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    ...theme.typography.h3,
    color: theme.text.white,
    marginLeft: theme.spacing.sm,
  },
  changeExerciseButton: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  changeExerciseButtonText: {
    ...theme.typography.body,
    color: theme.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '80%',
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.text.primary,
    marginBottom: theme.spacing.sm,
  },
  modalSubtitle: {
    ...theme.typography.caption,
    color: theme.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  modalInput: {
    backgroundColor: theme.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.typography.h2,
    color: theme.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    ...theme.typography.body,
    color: theme.text.secondary,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 2,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  modalConfirmButtonGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    ...theme.typography.body,
    color: theme.text.white,
    fontWeight: '700',
  },
});
