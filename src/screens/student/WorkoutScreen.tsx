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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

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
  const restStartTimeRef = useRef<number | null>(null);
  const restDurationRef = useRef<number>(0);
  
  // Estado para controlar pantalla de ejercicio completado
  const [showExerciseComplete, setShowExerciseComplete] = useState(false);
  const [completedExerciseData, setCompletedExerciseData] = useState<{
    exerciseName: string;
    totalSets: number;
    completedSets: number;
    totalWeight: number;
    totalReps: number;
    totalRestTime: number;
    averageRIR: number;
  } | null>(null);
  
  // Peso máximo y datos del ejercicio
  const [personalMax, setPersonalMax] = useState<number | null>(null);
  const [weightUsed, setWeightUsed] = useState<string>('');
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  
  // Historial de entrenamiento
  const [workoutSession, setWorkoutSession] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [exerciseRecords, setExerciseRecords] = useState<Map<string, WorkoutExerciseRecord>>(new Map());
  const [dayProgress, setDayProgress] = useState<Map<number, { completed: number; total: number; percentage: number }>>(new Map());
  
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
    
    // Listener para cuando se recibe una notificación (incluso en background)
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      if (notification.request.content.data?.type === 'rest_finished' && isResting) {
        // El descanso terminó mientras estaba en background
        setIsResting(false);
        setRestTime(0);
        restStartTimeRef.current = null;
        if (restTimerRef.current) {
          clearInterval(restTimerRef.current);
          restTimerRef.current = null;
        }
        showToast('¡Descanso terminado!', 'success');
      }
    });
    
    // Listener para cuando se toca una notificación
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data?.type === 'rest_finished' && isResting) {
        setIsResting(false);
        setRestTime(0);
        restStartTimeRef.current = null;
        if (restTimerRef.current) {
          clearInterval(restTimerRef.current);
          restTimerRef.current = null;
        }
      }
    });
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      notificationListener.remove();
      responseListener.remove();
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
  }, [isResting]);

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
    if (nextAppState === 'background' && isResting && restStartTimeRef.current) {
      // Cuando va al background:
      // 1. Cancelar el timer de JavaScript (no funciona en background)
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
      
      // 2. Calcular tiempo restante
      const elapsed = Math.floor((Date.now() - restStartTimeRef.current) / 1000);
      const remaining = Math.max(0, restDurationRef.current - elapsed);
      
      // 3. Programar notificación para cuando termine el descanso
      if (remaining > 0) {
        scheduleRestNotification(remaining);
      }
    } else if (nextAppState === 'active' && isResting && restStartTimeRef.current) {
      // Cuando vuelve al foreground, recalcular el tiempo restante
      const elapsed = Math.floor((Date.now() - restStartTimeRef.current) / 1000);
      const remaining = Math.max(0, restDurationRef.current - elapsed);
      
      // Cancelar notificación programada si existe
      if (notificationIdRef.current) {
        try {
          Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
          notificationIdRef.current = null;
        } catch (error) {
          // Ignorar
        }
      }
      
      if (remaining <= 0) {
        // El descanso ya terminó
        setIsResting(false);
        setRestTime(0);
        restStartTimeRef.current = null;
        showToast('¡Descanso terminado!', 'success');
      } else {
        // Actualizar el tiempo restante y reiniciar el timer
        setRestTime(remaining);
        // Reiniciar el timer de JavaScript
        if (restTimerRef.current) {
          clearInterval(restTimerRef.current);
        }
        restTimerRef.current = setInterval(() => {
          if (restStartTimeRef.current) {
            const elapsed = Math.floor((Date.now() - restStartTimeRef.current) / 1000);
            const remaining = Math.max(0, restDurationRef.current - elapsed);
            
            if (remaining <= 0) {
              clearInterval(restTimerRef.current!);
              setIsResting(false);
              restStartTimeRef.current = null;
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
              setRestTime(0);
            } else {
              setRestTime(remaining);
            }
          }
        }, 1000);
      }
    }
  };

  const scheduleRestNotification = async (seconds?: number) => {
    const timeToWait = seconds !== undefined ? seconds : restTime;
    if (timeToWait > 0) {
      try {
        // Cancelar notificación anterior si existe
        if (notificationIdRef.current) {
          try {
            await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
          } catch (error) {
            // Ignorar
          }
        }
        
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '¡Descanso terminado!',
            body: 'Ya puedes continuar con tu siguiente serie',
            sound: true,
            data: { type: 'rest_finished' },
          },
          trigger: {
            seconds: timeToWait,
          },
        });
        notificationIdRef.current = notificationId;
        console.log(`Notificación programada para ${timeToWait} segundos`);
      } catch (error) {
        console.log('Error programando notificación:', error);
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
        // Cargar progreso de cada día
        await loadDayProgress(found);
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

  const loadDayProgress = async (routineData: any) => {
    if (!user?.id || !routineData) return;
    
    try {
      const history = await workoutHistoryService.getUserWorkoutHistory(user.id);
      const progressMap = new Map<number, { completed: number; total: number; percentage: number }>();
      
      routineData.days.forEach((day: any) => {
        const totalExercises = day.exercises.length;
        // Contar sesiones completadas para este día
        const completedSessions = history.filter(
          (session) => session.routineId === routineData.id && 
                       session.dayNumber === day.dayNumber && 
                       session.completed
        );
        
        // Para simplificar, contamos sesiones completadas como ejercicios completados
        // En el futuro se podría contar ejercicios individuales completados
        const completed = completedSessions.length;
        const percentage = totalExercises > 0 ? Math.round((completed / totalExercises) * 100) : 0;
        
        progressMap.set(day.dayNumber, {
          completed: Math.min(completed, totalExercises),
          total: totalExercises,
          percentage,
        });
      });
      
      setDayProgress(progressMap);
    } catch (error) {
      console.error('Error loading day progress:', error);
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
    // Cargar peso máximo personal cuando se selecciona un ejercicio
    if (exercise.exerciseId && user?.id) {
      loadPersonalMax();
    }
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
        
        // Calcular datos del ejercicio completado
        const totalSets = selectedExercise.sets.length;
        const completedSets = updatedRecord.sets.length;
        const totalWeight = updatedRecord.sets.reduce((sum, s) => sum + (s.weight || 0), 0);
        const totalReps = updatedRecord.sets.reduce((sum, s) => sum + (s.repetitions || 0), 0);
        // Sumar tiempo de descanso de todas las series excepto la última
        const totalRestTime = selectedExercise.sets.slice(0, -1).reduce((sum, s) => sum + (s.restTime || 0), 0);
        const rirValues = selectedExercise.sets.map(s => s.rir).filter((r): r is number => r !== undefined && r !== null);
        const averageRIR = rirValues.length > 0 ? Math.round(rirValues.reduce((sum, r) => sum + r, 0) / rirValues.length) : 0;
        
        setCompletedExerciseData({
          exerciseName: selectedExercise.exercise?.name || 'Ejercicio',
          totalSets,
          completedSets,
          totalWeight,
          totalReps,
          totalRestTime,
          averageRIR,
        });
        
        // Mostrar pantalla de ejercicio completado
        setShowExerciseComplete(true);
        
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
      }
    } finally {
      setSaving(false);
    }
  };

  const startRest = (seconds: number) => {
    // Guardar timestamp de inicio y duración total
    restStartTimeRef.current = Date.now();
    restDurationRef.current = seconds;
    setRestTime(seconds);
    setIsResting(true);

    if (notificationIdRef.current) {
      try {
        Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      } catch (error) {
        // Ignorar
      }
    }

    scheduleRestNotification(seconds);

    // Limpiar timer anterior si existe
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }

    restTimerRef.current = setInterval(() => {
      if (restStartTimeRef.current && restDurationRef.current > 0) {
        // Calcular tiempo transcurrido desde el inicio
        const elapsed = Math.floor((Date.now() - restStartTimeRef.current) / 1000);
        const remaining = Math.max(0, restDurationRef.current - elapsed);
        
        if (remaining <= 0) {
          if (restTimerRef.current) {
            clearInterval(restTimerRef.current);
            restTimerRef.current = null;
          }
          setIsResting(false);
          restStartTimeRef.current = null;
          setRestTime(0);
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
        } else {
          setRestTime(remaining);
        }
      }
    }, 1000);
  };

  const skipRest = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    if (notificationIdRef.current) {
      try {
        Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
        notificationIdRef.current = null;
      } catch (error) {
        // Ignorar
      }
    }
    restStartTimeRef.current = null;
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
    const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const dayColors = ['#3B82F6', '#10B981', '#8B5CF6', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];
    
    return (
      <View style={styles.container}>
        <Loading visible={saving} message="Iniciando entrenamiento..." />
        {/* Header */}
        <View style={[styles.workoutHeader, { paddingTop: insets.top || 0 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={styles.workoutHeaderTitle}>Iniciar Entrenamiento</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Calendar Icon */}
          <View style={styles.calendarIconContainer}>
            <View style={styles.calendarIcon}>
              <Ionicons name="calendar" size={48} color={theme.primary.main} />
            </View>
          </View>

          {/* Title and Subtitle */}
          <Text style={styles.selectDayTitle}>Selecciona tu día</Text>
          <Text style={styles.selectDaySubtitle}>Elige el día de entrenamiento que deseas realizar</Text>

          {/* Days List */}
          {routine.days.map((day: any, index: number) => {
            const progress = dayProgress.get(day.dayNumber) || { completed: 0, total: day.exercises.length, percentage: 0 };
            const dayColor = dayColors[index % dayColors.length];
            const dayLabel = dayLabels[index % dayLabels.length];
            const isComplete = progress.percentage === 100;
            
            return (
              <TouchableOpacity
                key={day.dayNumber}
                onPress={() => startWorkout(day.dayNumber)}
                style={styles.workoutDayCard}
                activeOpacity={0.7}
                disabled={saving}
              >
                <View style={[styles.workoutDayBadge, { backgroundColor: dayColor }]}>
                  <Text style={styles.workoutDayBadgeText}>{dayLabel}</Text>
                </View>
                <View style={styles.workoutDayContent}>
                  <Text style={styles.workoutDayName}>{day.name || `Día ${day.dayNumber}`}</Text>
                  <View style={styles.workoutDayProgressRow}>
                    <View style={[styles.workoutProgressPill, { backgroundColor: isComplete ? '#10B981' : '#E5E7EB' }]}>
                      <Text style={[styles.workoutProgressPillText, { color: isComplete ? '#FFFFFF' : '#6B7280' }]}>
                        {progress.completed}/{progress.total}
                      </Text>
                      {isComplete && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.text.tertiary} style={{ marginLeft: 8 }} />
                  </View>
                  <View style={styles.workoutProgressBarContainer}>
                    <View style={styles.workoutProgressBar}>
                      <View style={[styles.workoutProgressBarFill, { width: `${progress.percentage}%`, backgroundColor: dayColor }]} />
                    </View>
                    <Text style={styles.workoutProgressPercentage}>{progress.percentage}%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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

  // Pantalla 2: Seleccionar ejercicio
  if (!selectedExercise) {
    const currentDay = routine.days.find((d: any) => d.dayNumber === selectedDay);
    if (!currentDay) return null;
    
    const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const dayColors = ['#3B82F6', '#10B981', '#8B5CF6', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];
    const dayIndex = routine.days.findIndex((d: any) => d.dayNumber === selectedDay);
    const dayColor = dayColors[dayIndex % dayColors.length];
    
    const totalExercises = currentDay.exercises.length;
    const completedCount = currentDay.exercises.filter((ex: RoutineExercise) =>
      completedExercises.has(ex.exerciseId)
    ).length;
    const progressPercentage = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;
    const remainingExercises = totalExercises - completedCount;
    
    // Encontrar el siguiente ejercicio no completado
    const nextExercise = currentDay.exercises.find((ex: RoutineExercise) =>
      !completedExercises.has(ex.exerciseId)
    );
    
    const allExercisesCompleted = completedCount === totalExercises;

    // Calcular tiempo estimado (aproximado: 3-4 min por ejercicio)
    const estimatedMinutes = totalExercises * 4;
    // Calcular calorías aproximadas (aproximado: 50-80 cal por ejercicio)
    const estimatedCalories = totalExercises * 60;

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.workoutHeader, { paddingTop: insets.top || 0 }]}>
          <TouchableOpacity onPress={() => setSelectedDay(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={styles.workoutHeaderTitle}>
            {currentDay.name || `Día ${selectedDay}`}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Progreso del Día */}
          <View style={styles.dayProgressCard}>
            <View style={styles.dayProgressHeader}>
              <Text style={styles.dayProgressTitle}>Progreso del Día</Text>
              <View style={[styles.dayProgressPill, { backgroundColor: progressPercentage === 100 ? '#10B981' : dayColor }]}>
                <Text style={styles.dayProgressPillText}>
                  {completedCount}/{totalExercises} completados
                </Text>
              </View>
            </View>
            <View style={styles.dayProgressBarContainer}>
              <View style={styles.dayProgressBar}>
                <View style={[styles.dayProgressBarFill, { width: `${progressPercentage}%`, backgroundColor: dayColor }]} />
              </View>
              <Text style={styles.dayProgressPercentage}>{progressPercentage}%</Text>
            </View>
            {remainingExercises > 0 && (
              <Text style={styles.dayProgressMessage}>
                ¡Vas muy bien! Te quedan {remainingExercises} ejercicio{remainingExercises !== 1 ? 's' : ''} por completar
              </Text>
            )}
            {allExercisesCompleted && (
              <Text style={styles.dayProgressMessage}>
                ¡Excelente! Has completado todos los ejercicios del día
              </Text>
            )}
          </View>

          {/* Lista de Ejercicios */}
          {currentDay.exercises.map((exercise: RoutineExercise, index: number) => {
            const isCompleted = completedExercises.has(exercise.exerciseId);
            const isNext = nextExercise?.id === exercise.id;
            const isPending = !isCompleted && !isNext;
            
            const firstSet = exercise.sets[0];
            const totalSets = exercise.sets.length;
            const allReps = exercise.sets.map(s => s.repetitions).filter((r): r is number => r !== undefined && r !== null);
            const repsRange = allReps.length > 0
              ? allReps.length === 1 || Math.min(...allReps) === Math.max(...allReps)
                ? `${allReps[0]} reps`
                : `${Math.min(...allReps)}-${Math.max(...allReps)} reps`
              : 'reps';
            const restTime = firstSet?.restTime || 90;
            const rir = firstSet?.rir;
            const weight = firstSet?.weight;
            
            return (
              <View key={exercise.id || index} style={styles.workoutExerciseCard}>
                <View style={[styles.workoutExerciseIcon, { backgroundColor: isCompleted ? '#10B981' : dayColor }]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                  ) : (
                    <Ionicons name="barbell" size={24} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.workoutExerciseContent}>
                  <View style={styles.workoutExerciseHeader}>
                    <Text style={styles.workoutExerciseName}>
                      {exercise.exercise?.name || `Ejercicio ${index + 1}`}
                    </Text>
                    {isNext && (
                      <View style={[styles.currentExerciseDot, { backgroundColor: dayColor }]} />
                    )}
                  </View>
                  <Text style={styles.workoutExerciseDetails}>
                    {totalSets} serie{totalSets !== 1 ? 's' : ''} x {repsRange}
                  </Text>
                  <View style={styles.workoutExerciseInfo}>
                    <View style={styles.workoutExerciseInfoItem}>
                      <Ionicons name="barbell-outline" size={14} color={theme.text.secondary} />
                      <Text style={styles.workoutExerciseInfoText}>
                        {weight ? `${weight}kg` : 'Peso corporal'}
                      </Text>
                    </View>
                    <View style={styles.workoutExerciseInfoItem}>
                      <Ionicons name="time-outline" size={14} color={theme.text.secondary} />
                      <Text style={styles.workoutExerciseInfoText}>{restTime}s descanso</Text>
                    </View>
                    {rir && (
                      <View style={styles.workoutExerciseInfoItem}>
                        <Ionicons name="star-outline" size={14} color={theme.text.secondary} />
                        <Text style={styles.workoutExerciseInfoText}>RIR {rir}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.workoutExerciseStatus}>
                  {isCompleted ? (
                    <View style={[styles.workoutStatusPill, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.workoutStatusPillText}>Completado</Text>
                      <Ionicons name="chevron-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    </View>
                  ) : isNext ? (
                    <TouchableOpacity
                      onPress={() => setSelectedExercise(exercise)}
                      style={[styles.workoutStatusPill, { backgroundColor: dayColor }]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.workoutStatusPillText}>Siguiente</Text>
                      <Ionicons name="chevron-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.workoutStatusPill, { backgroundColor: '#E5E7EB' }]}>
                      <Text style={[styles.workoutStatusPillText, { color: '#6B7280' }]}>Pendiente</Text>
                      <Ionicons name="lock-closed" size={14} color="#6B7280" style={{ marginLeft: 4 }} />
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* Botón Continuar */}
          {nextExercise && (
            <TouchableOpacity
              onPress={() => setSelectedExercise(nextExercise)}
              style={[styles.continueExerciseButton, { backgroundColor: dayColor }]}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={24} color="#FFFFFF" />
              <Text style={styles.continueExerciseButtonText}>
                Continuar con {nextExercise.exercise?.name || 'Ejercicio'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Resumen de la Sesión */}
          <View style={styles.sessionSummaryCard}>
            <Text style={styles.sessionSummaryTitle}>Resumen de la Sesión</Text>
            <View style={styles.sessionSummaryStats}>
              <View style={styles.sessionSummaryStat}>
                <Ionicons name="time-outline" size={24} color={dayColor} />
                <Text style={styles.sessionSummaryStatValue}>{estimatedMinutes}min</Text>
                <Text style={styles.sessionSummaryStatLabel}>Tiempo estimado</Text>
              </View>
              <View style={styles.sessionSummaryStat}>
                <Ionicons name="flame-outline" size={24} color={dayColor} />
                <Text style={styles.sessionSummaryStatValue}>{estimatedCalories}</Text>
                <Text style={styles.sessionSummaryStatLabel}>Calorías aprox.</Text>
              </View>
            </View>
          </View>

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

  // Obtener color del día
  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const dayColors = ['#3B82F6', '#10B981', '#8B5CF6', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];
  const dayIndex = selectedDay ? routine.days.findIndex((d: any) => d.dayNumber === selectedDay) : -1;
  const dayColor = dayIndex >= 0 ? dayColors[dayIndex % dayColors.length] : '#3B82F6';

  // Pantalla 4: Ejercicio completado (mostrar primero si está activa)
  if (showExerciseComplete && completedExerciseData) {
    const currentDay = routine.days.find((d: any) => d.dayNumber === selectedDay);
    const totalExercises = currentDay?.exercises.length || 0;
    const completedCount = currentDay?.exercises.filter((ex: RoutineExercise) =>
      completedExercises.has(ex.exerciseId)
    ).length || 0;
    const nextExercise = currentDay?.exercises.find((ex: RoutineExercise) =>
      !completedExercises.has(ex.exerciseId)
    );

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.workoutHeader, { paddingTop: insets.top || 0 }]}>
          <Text style={styles.workoutHeaderTitle}>Entrenamiento</Text>
          <TouchableOpacity
            onPress={() => {
              setShowExerciseComplete(false);
              setSelectedExercise(null);
              setCurrentSetIndex(0);
              setWeightUsed('');
            }}
            style={styles.backButton}
          >
            <Ionicons name="close" size={24} color={theme.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Icono de completado */}
          <View style={styles.completeIconContainer}>
            <View style={[styles.completeIconCircle, { backgroundColor: '#10B981' }]}>
              <Ionicons name="checkmark" size={64} color="#FFFFFF" />
            </View>
          </View>

          {/* Mensaje de completado */}
          <Text style={styles.completeTitle}>¡Ejercicio Completado!</Text>
          <Text style={styles.completeExerciseName}>{completedExerciseData.exerciseName}</Text>
          <Text style={styles.completeMessage}>Excelente trabajo, mantén el ritmo</Text>

          {/* Resumen del Ejercicio */}
          <View style={styles.exerciseSummaryCard}>
            <View style={styles.exerciseSummaryHeader}>
              <Ionicons name="bar-chart-outline" size={20} color={theme.primary.main} style={{ marginRight: 8 }} />
              <Text style={styles.exerciseSummaryTitle}>Resumen del Ejercicio</Text>
            </View>
            
            <View style={styles.exerciseSummaryStats}>
              <View style={[styles.exerciseSummaryStatCard, { backgroundColor: theme.iconBackground.light }]}>
                <Text style={styles.exerciseSummaryStatLabel}>Series</Text>
                <Text style={styles.exerciseSummaryStatValue}>{completedExerciseData.completedSets}/{completedExerciseData.totalSets}</Text>
              </View>
              <View style={[styles.exerciseSummaryStatCard, { backgroundColor: theme.iconBackground.light }]}>
                <Text style={styles.exerciseSummaryStatLabel}>Peso Total</Text>
                <Text style={styles.exerciseSummaryStatValue}>{completedExerciseData.totalWeight}kg</Text>
              </View>
            </View>

            <View style={styles.exerciseSummaryDetails}>
              <View style={styles.exerciseSummaryDetailRow}>
                <Text style={styles.exerciseSummaryDetailLabel}>Repeticiones totales</Text>
                <Text style={styles.exerciseSummaryDetailValue}>{completedExerciseData.totalReps} reps</Text>
              </View>
              <View style={styles.exerciseSummaryDetailRow}>
                <Text style={styles.exerciseSummaryDetailLabel}>Tiempo de descanso</Text>
                <Text style={styles.exerciseSummaryDetailValue}>{formatTime(completedExerciseData.totalRestTime)}</Text>
              </View>
              <View style={styles.exerciseSummaryDetailRow}>
                <Text style={styles.exerciseSummaryDetailLabel}>RIR promedio</Text>
                <Text style={styles.exerciseSummaryDetailValue}>{completedExerciseData.averageRIR}</Text>
              </View>
            </View>
          </View>

          {/* Progreso del Día */}
          <View style={styles.dayProgressIndicator}>
            <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary.main} style={{ marginRight: 8 }} />
            <Text style={styles.dayProgressIndicatorText}>Progreso del Día</Text>
            <Text style={styles.dayProgressIndicatorValue}>{completedCount}/{totalExercises}</Text>
          </View>

          {/* Botones */}
          {nextExercise ? (
            <TouchableOpacity
              onPress={() => {
                setShowExerciseComplete(false);
                setSelectedExercise(nextExercise);
                setCurrentSetIndex(0);
                setWeightUsed('');
              }}
              style={[styles.nextExerciseButton, { backgroundColor: dayColor }]}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.nextExerciseButtonText}>Siguiente Ejercicio</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setShowExerciseComplete(false);
                setSelectedExercise(null);
                setCurrentSetIndex(0);
                setWeightUsed('');
              }}
              style={[styles.nextExerciseButton, { backgroundColor: dayColor }]}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.nextExerciseButtonText}>Volver a Ejercicios</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              setShowExerciseComplete(false);
              setSelectedExercise(null);
              setCurrentSetIndex(0);
              setWeightUsed('');
            }}
            style={styles.viewMenuButton}
            activeOpacity={0.8}
          >
            <Ionicons name="information-circle-outline" size={20} color={theme.primary.main} style={{ marginRight: 8 }} />
            <Text style={styles.viewMenuButtonText}>Ver Menú de Ejercicios</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Pantalla 3: Temporizador de descanso (mostrar si está en descanso)
  if (isResting && selectedExercise) {
    const nextSetIndex = currentSetIndex;
    const nextSet = selectedExercise.sets[nextSetIndex];
    const progressPercentage = restDurationRef.current > 0 
      ? Math.round(((restDurationRef.current - restTime) / restDurationRef.current) * 100)
      : 0;
    
    // Obtener datos de la serie completada
    const completedSetIndex = currentSetIndex - 1;
    const completedSet = completedSetIndex >= 0 ? selectedExercise.sets[completedSetIndex] : null;
    const exerciseId = selectedExercise.exerciseId;
    const exerciseRecord = exerciseRecords.get(exerciseId);
    const lastCompletedSet = exerciseRecord?.sets[exerciseRecord.sets.length - 1];

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.workoutHeader, { paddingTop: insets.top || 0 }]}>
          <TouchableOpacity onPress={skipRest} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={styles.workoutHeaderTitle}>{selectedExercise.exercise?.name || 'Ejercicio'}</Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedExercise(null);
              setCurrentSetIndex(0);
              setWeightUsed('');
              setIsResting(false);
            }}
            style={styles.backButton}
          >
            <Ionicons name="ellipsis-vertical" size={24} color={theme.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Status de serie completada */}
          <View style={styles.restStatusCard}>
            <View style={styles.restStatusRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.restStatusText}>Serie {currentSetIndex} de {selectedExercise.sets.length} completada</Text>
            </View>
            {nextSetIndex < selectedExercise.sets.length && (
              <Text style={styles.restNextText}>Siguiente: Serie {nextSetIndex + 1}</Text>
            )}
          </View>

          {/* Timer circular */}
          <View style={styles.restTimerContainer}>
            <View style={[styles.restTimerCircle, { borderColor: theme.background.tertiary }]}>
              <View style={[styles.restTimerProgress, { 
                transform: [{ rotate: `${(progressPercentage / 100) * 360}deg` }],
                borderTopColor: dayColor,
                borderRightColor: dayColor,
              }]} />
              <View style={styles.restTimerInner}>
                <Ionicons name="time-outline" size={32} color={dayColor} style={{ marginBottom: 8 }} />
                <Text style={styles.restTimerTime}>{formatTime(restTime)}</Text>
                <Text style={styles.restTimerLabel}>Descanso</Text>
              </View>
            </View>
          </View>

          {/* Serie completada */}
          {completedSet && lastCompletedSet && (
            <View style={styles.completedSetCard}>
              <View style={styles.completedSetStat}>
                <Text style={styles.completedSetStatLabel}>Peso</Text>
                <Text style={styles.completedSetStatValue}>{lastCompletedSet.weight || completedSet.weight || '0'}kg</Text>
              </View>
              <View style={styles.completedSetStat}>
                <Text style={styles.completedSetStatLabel}>Reps</Text>
                <Text style={styles.completedSetStatValue}>{lastCompletedSet.repetitions || completedSet.repetitions || 0}</Text>
              </View>
              <View style={styles.completedSetStat}>
                <Text style={styles.completedSetStatLabel}>RIR</Text>
                <Text style={styles.completedSetStatValue}>{completedSet.rir !== undefined ? completedSet.rir : '-'}</Text>
              </View>
            </View>
          )}

          {/* Botones */}
          <TouchableOpacity
            onPress={skipRest}
            style={[styles.skipRestButtonDark, { backgroundColor: dayColor }]}
            activeOpacity={0.8}
          >
            <Ionicons name="play-forward" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.skipRestButtonDarkText}>Saltar Descanso</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSelectedExercise(null);
              setCurrentSetIndex(0);
              setWeightUsed('');
              setIsResting(false);
            }}
            style={styles.changeExerciseButtonDark}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color={theme.text.primary} style={{ marginRight: 8 }} />
            <Text style={styles.changeExerciseButtonDarkText}>Cambiar Ejercicio</Text>
          </TouchableOpacity>

          {/* Próxima Serie */}
          {nextSet && (
            <View style={styles.nextSetCard}>
              <Text style={styles.nextSetTitle}>Próxima Serie</Text>
              <View style={styles.nextSetContent}>
                <View style={styles.nextSetInfo}>
                  <Text style={styles.nextSetLabel}>Repeticiones</Text>
                  <Text style={styles.nextSetValue}>{nextSet.repetitions || 0}</Text>
                </View>
                <View style={styles.nextSetInfo}>
                  <Text style={styles.nextSetLabel}>Peso Sugerido</Text>
                  <Text style={styles.nextSetValue}>{nextSet.weight || calculateWeightFromPercentage(nextSet.loadPercentage) || '0'}kg</Text>
                </View>
                <View style={[styles.nextSetBadge, { backgroundColor: dayColor }]}>
                  <Text style={styles.nextSetBadgeText}>{nextSetIndex + 1} de {selectedExercise.sets.length}</Text>
                </View>
              </View>
              <View style={styles.nextSetRIR}>
                <Text style={styles.nextSetRIRLabel}>RIR</Text>
                <Text style={styles.nextSetRIRValue}>{nextSet.rir !== undefined ? nextSet.rir : '-'}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Pantalla 2: Modo entrenamiento activo
  const currentSet = getCurrentSet();
  if (!currentSet || !selectedExercise) return null;

  const plannedWeight = currentSet.weight || calculateWeightFromPercentage(currentSet.loadPercentage);
  const displayWeight = weightUsed || plannedWeight?.toString() || '0';
  const currentDayForExercise = routine.days.find((d: any) => d.dayNumber === selectedDay);
  const dayName = currentDayForExercise?.name || `Día ${selectedDay}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.workoutHeader, { paddingTop: insets.top || 0 }]}>
        <TouchableOpacity onPress={() => {
          setSelectedExercise(null);
          setCurrentSetIndex(0);
          setWeightUsed('');
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={styles.workoutHeaderTitle}>{selectedExercise.exercise?.name || 'Ejercicio'}</Text>
        <TouchableOpacity
          onPress={() => {
            setSelectedExercise(null);
            setCurrentSetIndex(0);
            setWeightUsed('');
          }}
          style={styles.backButton}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={theme.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Card de ejercicio */}
        <View style={[styles.exerciseOverviewCard, { backgroundColor: dayColor }]}>
          <View style={styles.exerciseOverviewContent}>
            <View style={[styles.exerciseOverviewIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="barbell" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.exerciseOverviewText}>
              <Text style={styles.exerciseOverviewName}>{selectedExercise.exercise?.name || 'Ejercicio'}</Text>
              <Text style={styles.exerciseOverviewCategory}>
                {selectedExercise.exercise?.category || 'Sin categoría'} - {selectedExercise.exercise?.type || 'Compuesto'}
              </Text>
            </View>
            <View style={styles.exerciseOverviewProgress}>
              <Text style={styles.exerciseOverviewSeries}>Serie {currentSetIndex + 1}/{selectedExercise.sets.length}</Text>
              <Text style={styles.exerciseOverviewDay}>{dayName}</Text>
            </View>
          </View>
          <View style={styles.exerciseOverviewBar}>
            <View style={[styles.exerciseOverviewBarFill, { 
              width: `${((currentSetIndex + 1) / selectedExercise.sets.length) * 100}%`,
              backgroundColor: 'rgba(255, 255, 255, 0.3)'
            }]} />
            <Text style={styles.exerciseOverviewBarText}>
              {Math.round(((currentSetIndex + 1) / selectedExercise.sets.length) * 100)}%
            </Text>
          </View>
        </View>

        {/* Serie Actual */}
        <View style={styles.currentSeriesCard}>
          <Text style={styles.currentSeriesTitle}>Serie Actual</Text>
          <View style={styles.currentSeriesStats}>
            <View style={[styles.currentSeriesStatCard, { backgroundColor: theme.iconBackground.light }]}>
              <Ionicons name="refresh" size={24} color={theme.primary.main} />
              <Text style={styles.currentSeriesStatLabel}>Repeticiones</Text>
              <Text style={styles.currentSeriesStatValue}>{currentSet.repetitions || 0}</Text>
            </View>
            <View style={[styles.currentSeriesStatCard, { backgroundColor: theme.iconBackground.light }]}>
              <Ionicons name="speedometer-outline" size={24} color={theme.primary.main} />
              <Text style={styles.currentSeriesStatLabel}>RIR</Text>
              <Text style={styles.currentSeriesStatValue}>{currentSet.rir !== undefined ? currentSet.rir : '-'}</Text>
            </View>
          </View>

          {/* Peso */}
          <Text style={styles.weightLabel}>Peso (kg)</Text>
          <View style={styles.weightInputContainer}>
            <TouchableOpacity
              onPress={() => {
                const current = parseFloat(displayWeight) || 0;
                setWeightUsed(Math.max(0, current - 2.5).toString());
              }}
              style={[styles.weightButton, { backgroundColor: dayColor }]}
              activeOpacity={0.8}
            >
              <Ionicons name="remove" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setWeightModalVisible(true)}
              style={styles.weightDisplay}
              activeOpacity={0.7}
            >
              <Text style={styles.weightDisplayText}>{displayWeight}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const current = parseFloat(displayWeight) || 0;
                setWeightUsed((current + 2.5).toString());
              }}
              style={[styles.weightButton, { backgroundColor: dayColor }]}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Botones */}
          <View style={styles.currentSeriesActions}>
            <TouchableOpacity
              onPress={completeSet}
              style={[styles.completeSeriesButton, { backgroundColor: '#10B981' }]}
              activeOpacity={0.8}
              disabled={saving}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.completeSeriesButtonText}>Completar Serie</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSelectedExercise(null);
                setCurrentSetIndex(0);
                setWeightUsed('');
              }}
              style={[styles.changeExerciseButtonDark, { backgroundColor: dayColor }]}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.changeExerciseButtonDarkText}>Cambiar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Series Anteriores */}
        {currentSetIndex > 0 && (() => {
          const exerciseId = selectedExercise.exerciseId;
          const exerciseRecord = exerciseRecords.get(exerciseId);
          const completedSets = exerciseRecord?.sets || [];
          
          return completedSets.length > 0 && (
            <View style={styles.previousSeriesSection}>
              <Text style={styles.previousSeriesTitle}>Series Anteriores</Text>
              {completedSets.map((setRecord, index) => {
                const originalSet = selectedExercise.sets[index];
                return (
                  <View key={index} style={styles.previousSeriesCard}>
                    <View style={[styles.previousSeriesIcon, { backgroundColor: '#10B981' }]}>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.previousSeriesContent}>
                      <Text style={styles.previousSeriesName}>Serie {index + 1}</Text>
                      <Text style={styles.previousSeriesStatus}>Completada</Text>
                    </View>
                    <View style={styles.previousSeriesData}>
                      <Text style={styles.previousSeriesWeight}>{setRecord.weight || originalSet.weight || '0'}kg x {setRecord.repetitions || originalSet.repetitions || 0}</Text>
                      {originalSet.rir !== undefined && (
                        <Text style={styles.previousSeriesRIR}>RIR {originalSet.rir}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })()}
      </ScrollView>

      {/* Modal de peso usado */}
      <Modal
        visible={weightModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWeightModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, theme.spacing.xl) }]}>
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
                style={[styles.modalConfirmButton, { backgroundColor: dayColor }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalConfirmButtonText, { color: '#FFFFFF' }]}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Loading 
        visible={saving || loadingMax} 
        message={
          saving 
            ? "Guardando serie..." 
            : loadingMax 
            ? "Cargando peso máximo..." 
            : "Cargando..."
        } 
      />
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
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.background.tertiary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutHeaderTitle: {
    ...theme.typography.h2,
    color: theme.text.primary,
    fontWeight: '700',
  },
  calendarIconContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  calendarIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.iconBackground.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectDayTitle: {
    ...theme.typography.h1,
    color: theme.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  selectDaySubtitle: {
    ...theme.typography.body,
    color: theme.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
  },
  workoutDayCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  workoutDayBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },
  workoutDayBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  workoutDayContent: {
    flex: 1,
  },
  workoutDayName: {
    ...theme.typography.h3,
    color: theme.text.primary,
    marginBottom: theme.spacing.sm,
  },
  workoutDayProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  workoutProgressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  workoutProgressPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workoutProgressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.background.tertiary,
    borderRadius: 3,
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
  },
  workoutProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  workoutProgressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text.secondary,
    minWidth: 40,
    textAlign: 'right',
  },
  // Estilos para la pantalla de selección de ejercicios
  dayProgressCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  dayProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  dayProgressTitle: {
    ...theme.typography.h3,
    color: theme.text.primary,
    fontWeight: '600',
  },
  dayProgressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
  },
  dayProgressPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dayProgressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  dayProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.background.tertiary,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
  },
  dayProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  dayProgressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
    minWidth: 45,
    textAlign: 'right',
  },
  dayProgressMessage: {
    ...theme.typography.body,
    color: theme.text.secondary,
    marginTop: theme.spacing.xs,
  },
  workoutExerciseCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  workoutExerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },
  workoutExerciseContent: {
    flex: 1,
  },
  workoutExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  workoutExerciseName: {
    ...theme.typography.h3,
    color: theme.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  currentExerciseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary.main,
    marginLeft: theme.spacing.sm,
  },
  workoutExerciseDetails: {
    ...theme.typography.body,
    color: theme.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  workoutExerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  workoutExerciseInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  workoutExerciseInfoText: {
    ...theme.typography.caption,
    color: theme.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  workoutExerciseStatus: {
    marginLeft: theme.spacing.md,
  },
  workoutStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
  },
  workoutStatusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueExerciseButtonText: {
    ...theme.typography.h3,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  sessionSummaryCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  sessionSummaryTitle: {
    ...theme.typography.h3,
    color: theme.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
  },
  sessionSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sessionSummaryStat: {
    alignItems: 'center',
  },
  sessionSummaryStatValue: {
    ...theme.typography.h2,
    color: theme.text.primary,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  sessionSummaryStatLabel: {
    ...theme.typography.caption,
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
  // Estilos para pantallas oscuras (full screen)
  darkContainer: {
    backgroundColor: '#1A1A2E',
  },
  darkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    backgroundColor: '#1A1A2E',
  },
  darkHeaderTitle: {
    ...theme.typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  darkHeaderClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkHeaderMenu: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkScrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  // Estilos para pantalla de ejercicio completado
  completeIconContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  completeIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    ...theme.typography.h1,
    color: theme.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontSize: 28,
  },
  completeExerciseName: {
    ...theme.typography.h3,
    color: theme.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  completeMessage: {
    ...theme.typography.body,
    color: theme.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  exerciseSummaryCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  exerciseSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  exerciseSummaryTitle: {
    ...theme.typography.h3,
    color: theme.text.primary,
    fontWeight: '600',
  },
  exerciseSummaryStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  exerciseSummaryStatCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  exerciseSummaryStatLabel: {
    ...theme.typography.caption,
    color: theme.text.secondary,
    marginTop: theme.spacing.xs,
  },
  exerciseSummaryStatValue: {
    ...theme.typography.h2,
    color: theme.text.primary,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  exerciseSummaryDetails: {
    gap: theme.spacing.md,
  },
  exerciseSummaryDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseSummaryDetailLabel: {
    ...theme.typography.body,
    color: theme.text.secondary,
  },
  exerciseSummaryDetailValue: {
    ...theme.typography.body,
    color: theme.text.primary,
    fontWeight: '600',
  },
  dayProgressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  dayProgressIndicatorText: {
    ...theme.typography.body,
    color: theme.text.primary,
    flex: 1,
  },
  dayProgressIndicatorValue: {
    ...theme.typography.h3,
    color: theme.text.primary,
    fontWeight: '700',
  },
  nextExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  nextExerciseButtonText: {
    ...theme.typography.h3,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  viewMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.background.secondary,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  viewMenuButtonText: {
    ...theme.typography.body,
    color: theme.text.primary,
    fontWeight: '600',
  },
  // Estilos para pantalla de temporizador
  restStatusCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  restStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  restStatusText: {
    ...theme.typography.body,
    color: theme.text.primary,
    fontWeight: '600',
  },
  restNextText: {
    ...theme.typography.caption,
    color: theme.text.secondary,
    marginLeft: 28,
  },
  restTimerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  restTimerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  restTimerProgress: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#8B5CF6',
    borderRightColor: '#8B5CF6',
  },
  restTimerInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTimerTime: {
    ...theme.typography.h1,
    color: theme.text.primary,
    fontSize: 36,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  restTimerLabel: {
    ...theme.typography.body,
    color: theme.text.secondary,
  },
  completedSetCard: {
    flexDirection: 'row',
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  completedSetStat: {
    alignItems: 'center',
  },
  completedSetStatLabel: {
    ...theme.typography.caption,
    color: theme.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  completedSetStatValue: {
    ...theme.typography.h3,
    color: theme.text.primary,
    fontWeight: '700',
  },
  skipRestButtonDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  skipRestButtonDarkText: {
    ...theme.typography.h3,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  changeExerciseButtonDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.background.secondary,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  changeExerciseButtonDarkText: {
    ...theme.typography.body,
    color: theme.text.primary,
    fontWeight: '600',
  },
  nextSetCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  nextSetTitle: {
    ...theme.typography.h3,
    color: theme.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  nextSetContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  nextSetInfo: {
    flex: 1,
  },
  nextSetLabel: {
    ...theme.typography.caption,
    color: theme.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  nextSetValue: {
    ...theme.typography.h3,
    color: theme.text.primary,
    fontWeight: '700',
  },
  nextSetBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  nextSetBadgeText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nextSetRIR: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextSetRIRLabel: {
    ...theme.typography.body,
    color: theme.text.secondary,
  },
  nextSetRIRValue: {
    ...theme.typography.h3,
    color: theme.text.primary,
    fontWeight: '700',
  },
  // Estilos para pantalla de ejercicio activo
  exerciseOverviewCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  exerciseOverviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  exerciseOverviewIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  exerciseOverviewText: {
    flex: 1,
  },
  exerciseOverviewName: {
    ...theme.typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  exerciseOverviewCategory: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  exerciseOverviewProgress: {
    alignItems: 'flex-end',
  },
  exerciseOverviewSeries: {
    ...theme.typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  exerciseOverviewDay: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  exerciseOverviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  exerciseOverviewBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  exerciseOverviewBarText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  currentSeriesCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  currentSeriesTitle: {
    ...theme.typography.h3,
    color: theme.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
  },
  currentSeriesStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  currentSeriesStatCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  currentSeriesStatLabel: {
    ...theme.typography.caption,
    color: theme.text.secondary,
    marginTop: theme.spacing.xs,
  },
  currentSeriesStatValue: {
    ...theme.typography.h2,
    color: theme.text.primary,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  weightLabel: {
    ...theme.typography.body,
    color: theme.text.secondary,
    marginBottom: theme.spacing.md,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  weightButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightDisplay: {
    marginHorizontal: theme.spacing.xl,
    minWidth: 100,
    alignItems: 'center',
  },
  weightDisplayText: {
    ...theme.typography.h1,
    color: theme.text.primary,
    fontSize: 32,
    fontWeight: '700',
  },
  currentSeriesActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  completeSeriesButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  completeSeriesButtonText: {
    ...theme.typography.h3,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  previousSeriesSection: {
    marginTop: theme.spacing.lg,
  },
  previousSeriesTitle: {
    ...theme.typography.h3,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  previousSeriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  previousSeriesIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  previousSeriesContent: {
    flex: 1,
  },
  previousSeriesName: {
    ...theme.typography.body,
    color: theme.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  previousSeriesStatus: {
    ...theme.typography.caption,
    color: theme.text.secondary,
  },
  previousSeriesData: {
    alignItems: 'flex-end',
  },
  previousSeriesWeight: {
    ...theme.typography.body,
    color: theme.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  previousSeriesRIR: {
    ...theme.typography.caption,
    color: '#10B981',
    fontWeight: '600',
  },
  // Estilos para modal de peso (tema oscuro)
  modalContentDark: {
    backgroundColor: '#1A1A2E',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '80%',
  },
  modalTitleDark: {
    ...theme.typography.h2,
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
  },
  modalSubtitleDark: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: theme.spacing.lg,
  },
  modalInputDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.typography.h2,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalCancelButtonDark: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  modalCancelButtonDarkText: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalConfirmButtonDark: {
    flex: 2,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  modalConfirmButtonDarkText: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
