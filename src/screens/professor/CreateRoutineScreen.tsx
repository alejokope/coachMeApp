// Pantalla de creación de rutina - Rediseño completo basado en mockups
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Routine, RoutineDay, RoutineExercise, ExerciseSet, Exercise } from '../../types';
import { routineService } from '../../services/routineService';
import { exerciseService } from '../../services/exerciseService';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '../../components/Toast';

type Step = 'basic' | 'days' | 'exercises' | 'review';

export default function CreateRoutineScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Paso actual
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [showBasicModal, setShowBasicModal] = useState(true);
  const [showDaysModal, setShowDaysModal] = useState(false);
  const [showSetsModal, setShowSetsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedReviewDay, setSelectedReviewDay] = useState<number | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number | null>(null);
  
  // Datos básicos
  const [routineName, setRoutineName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState(false);
  
  // Días
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  
  // Ejercicios
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  
  // Series
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [numberOfSets, setNumberOfSets] = useState(3);
  
  // Estados generales
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type?: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message: message, type: type });
  };

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    if (exerciseSearchQuery.trim()) {
      const filtered = exercises.filter((ex) =>
        ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
      );
      setFilteredExercises(filtered);
    } else {
      setFilteredExercises(exercises);
    }
  }, [exerciseSearchQuery, exercises]);

  const loadExercises = async () => {
    try {
      setLoadingExercises(true);
      const gymId = (user as any)?.gymId;
      const data = await exerciseService.getAllExercises(gymId);
      setExercises(data);
      setFilteredExercises(data);
    } catch (error) {
      showToast('No se pudieron cargar los ejercicios', 'error');
    } finally {
      setLoadingExercises(false);
    }
  };

  // ========== PASO 1: INFORMACIÓN BÁSICA ==========
  const handleBasicNext = () => {
    if (!routineName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setShowBasicModal(false);
    setShowDaysModal(true);
    setCurrentStep('days');
  };

  // ========== PASO 2: DÍAS DE ENTRENAMIENTO ==========
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
    const updatedDays = days.filter(d => d.id !== dayId).map((d, idx) => ({
      ...d,
      dayNumber: idx + 1,
    }));
    setDays(updatedDays);
  };

  const updateDayName = (dayId: string, name: string) => {
    setDays(days.map(d => d.id === dayId ? { ...d, name: name } : d));
  };

  const handleDaysNext = () => {
    if (days.length === 0) {
      showToast('Debes agregar al menos un día', 'error');
      return;
    }
    setShowDaysModal(false);
    setCurrentStep('exercises');
    setCurrentDayIndex(0);
  };

  // ========== PASO 3: EJERCICIOS DEL DÍA ==========
  const openExerciseModal = () => {
    setShowExerciseModal(true);
  };

  const selectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(false);
    // Inicializar series por defecto
    const defaultSets: ExerciseSet[] = Array.from({ length: numberOfSets }, (_, i) => ({
      id: `set-${Date.now()}-${i}`,
      repetitions: 10,
      weight: 0,
      restTime: 90,
      rir: 2,
    }));
    setSets(defaultSets);
    setShowSetsModal(true);
  };

  const handleExerciseStepNext = () => {
    if (isEditing) {
      // Si estamos editando, ir directo a revisar rutina
      setIsEditing(false);
      setCurrentStep('review');
      setShowReviewModal(true);
    } else if (currentDayIndex < days.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
    } else {
      setCurrentStep('review');
      setShowReviewModal(true);
    }
  };

  const handleExerciseStepBack = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
    } else {
      setShowDaysModal(true);
      setCurrentStep('days');
    }
  };

  // ========== PASO 4: CONFIGURAR SERIES ==========
  const updateSet = (setId: string, field: keyof ExerciseSet, value: any) => {
    setSets(sets.map(set => {
      if (set.id === setId) {
        return { ...set, [field]: value } as ExerciseSet;
      }
      return set;
    }));
  };

  const addSet = () => {
    const newSet: ExerciseSet = {
      id: `set-${Date.now()}`,
      repetitions: 10,
      weight: 0,
      restTime: 90,
      rir: 2,
    };
    setSets([...sets, newSet]);
    setNumberOfSets(sets.length + 1);
  };

  const removeSet = (setId: string) => {
    if (sets.length > 1) {
      setSets(sets.filter(s => s.id !== setId));
      setNumberOfSets(sets.length - 1);
    }
  };

  const copyToAll = () => {
    if (sets.length === 0) return;
    const firstSet = sets[0];
    setSets(sets.map(set => ({ ...set, ...firstSet })));
  };

  const handleSetsSave = () => {
    if (!selectedExercise || sets.length === 0) return;
    
    const currentDay = days[currentDayIndex];
    if (!currentDay) return;

    if (currentExerciseIndex !== null) {
      // Actualizar ejercicio existente
      const updatedDays = days.map((d, idx) => {
        if (idx === currentDayIndex) {
          const updatedExercises = [...d.exercises];
          updatedExercises[currentExerciseIndex] = {
            ...updatedExercises[currentExerciseIndex],
            sets: sets,
          };
          return { ...d, exercises: updatedExercises };
        }
        return d;
      });
      setDays(updatedDays);
    } else {
      // Agregar nuevo ejercicio
      const routineExercise: RoutineExercise = {
        id: `exercise-${Date.now()}`,
        exerciseId: selectedExercise.id,
        exercise: selectedExercise,
        sets: sets,
        order: currentDay.exercises.length + 1,
      };

      const updatedDays = days.map((d, idx) =>
        idx === currentDayIndex
          ? { ...d, exercises: [...d.exercises, routineExercise] }
          : d
      );
      setDays(updatedDays);
    }

    setShowSetsModal(false);
    setSelectedExercise(null);
    setSets([]);
    setCurrentExerciseIndex(null);
    setNumberOfSets(3);
  };

  // ========== PASO 5: REVISAR RUTINA ==========
  const handleReviewBack = () => {
    if (isEditing) {
      setIsEditing(false);
      setShowReviewModal(true);
      setCurrentStep('review');
    } else {
      setCurrentStep('exercises');
      setCurrentDayIndex(days.length - 1);
      setShowReviewModal(false);
    }
  };

  const handleEdit = (dayIndex?: number) => {
    setIsEditing(true);
    setCurrentStep('exercises');
    if (dayIndex !== undefined) {
      setCurrentDayIndex(dayIndex);
    } else {
      setCurrentDayIndex(0);
    }
    setShowReviewModal(false);
  };

  const handleConfirm = async () => {
    try {
      setSaving(true);
      const isPersonalRoutine = user?.userType === 'person' || user?.userType === 'student';
      const gymId = isPersonalRoutine ? null : ((user as any)?.gymId || null);
      
      const routineData: any = {
        name: routineName,
        professorId: user?.id || '',
        days: days,
        isTemplate: user?.userType === 'professor',
      };
      
      if (description && description.trim()) {
        routineData.description = description;
      }
      
      if (gymId) {
        routineData.gymId = gymId;
      }
      
      await routineService.createRoutine(routineData);
      showToast('Rutina creada correctamente', 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      showToast(error.message || 'No se pudo crear la rutina', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getTotalExercises = () => {
    return days.reduce((total, day) => total + day.exercises.length, 0);
  };

  const getTotalSets = () => {
    return days.reduce((total, day) => 
      total + day.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    , 0);
  };

  const getEstimatedDuration = () => {
    const totalSets = getTotalSets();
    // Estimación: 2-3 minutos por serie
    const minutes = Math.ceil(totalSets * 2.5);
    return `${minutes}-${minutes + 10} min`;
  };

  // ========== RENDERIZADO ==========
  
  // Paso 1: Modal de Información Básica
  const renderBasicModal = () => (
    <Modal
      visible={showBasicModal}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => navigation.goBack()}
      statusBarTranslucent
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top || 0, paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nueva Rutina</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressSteps}>
              <View style={[styles.progressStep, styles.progressStepActive]}>
                <Text style={styles.progressStepNumber}>1</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <Text style={styles.progressStepNumber}>2</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <Text style={styles.progressStepNumber}>3</Text>
              </View>
            </View>
            <Text style={styles.progressLabel}>Información Básica</Text>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Nombre */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Nombre de la rutina *</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  value={routineName}
                  onChangeText={(text) => {
                    setRoutineName(text);
                    setNameError(false);
                  }}
                  placeholder="Ej: Rutina Push/Pull/Legs"
                  placeholderTextColor="#9CA3AF"
                  style={styles.textInput}
                  autoComplete="off"
                  textContentType="none"
                />
                <Ionicons name="barbell" size={24} color="#667eea" style={styles.inputIconRight} />
              </View>
              {nameError && (
                <Text style={styles.errorText}>Este campo es obligatorio</Text>
              )}
            </View>

            {/* Descripción */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Descripción (opcional)</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe tu rutina, objetivos, notas importantes"
                  placeholderTextColor="#9CA3AF"
                  style={styles.textArea}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={200}
                  autoComplete="off"
                  textContentType="none"
                />
                <View style={styles.textAreaFooter}>
                  <Text style={styles.helperText}>Ayuda a recordar el propósito de tu rutina</Text>
                  <Text style={styles.charCount}>{description.length}/200</Text>
                </View>
              </View>
            </View>

            {/* Consejos */}
            <View style={styles.tipsContainer}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb-outline" size={20} color="#667eea" />
                <Text style={styles.tipsTitle}>Consejos para tu rutina</Text>
              </View>
              <View style={styles.tipsList}>
                <Text style={styles.tipItem}>• Usa nombres descriptivos como Fuerza Upper Body</Text>
                <Text style={styles.tipItem}>• Incluye tus objetivos en la descripción</Text>
                <Text style={styles.tipItem}>• Menciona la frecuencia semanal planificada</Text>
              </View>
            </View>

            {/* Vista Previa */}
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>Vista previa</Text>
                <Ionicons name="eye-outline" size={20} color="#667eea" />
              </View>
              <Text style={styles.previewName}>
                {routineName || 'Nombre de tu rutina'}
              </Text>
              <Text style={styles.previewDescription}>
                {description || 'La descripcion aparecera aqui'}
              </Text>
              <View style={styles.previewStats}>
                <View style={styles.previewStat}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.previewStatText}>{days.length} días</Text>
                </View>
                <View style={styles.previewStat}>
                  <Ionicons name="barbell-outline" size={16} color="#6B7280" />
                  <Text style={styles.previewStatText}>{getTotalExercises()} ejercicios</Text>
                </View>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>Borrador</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Botón Continuar */}
          <TouchableOpacity
            onPress={handleBasicNext}
            style={styles.continueButton}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
      </View>
    </Modal>
  );

  // Paso 2: Modal de Días
  const renderDaysModal = () => (
    <Modal
      visible={showDaysModal}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        setShowDaysModal(false);
        setShowBasicModal(true);
      }}
      statusBarTranslucent
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top || 0, paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setShowDaysModal(false);
                setShowBasicModal(true);
              }} 
              style={styles.backIconButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Días de Entrenamiento</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressSteps}>
              <View style={[styles.progressStep, styles.progressStepCompleted]}>
                <Text style={styles.progressStepNumber}>1</Text>
              </View>
              <View style={styles.progressLineCompleted} />
              <View style={[styles.progressStep, styles.progressStepActive]}>
                <Text style={styles.progressStepNumber}>2</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <Text style={styles.progressStepNumber}>3</Text>
              </View>
            </View>
            <Text style={styles.progressLabel}>Días de Entrenamiento</Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#667eea" />
            <Text style={styles.infoBoxText}>
              Configura tus días de entrenamiento. Agrega los días que entrenarás y personaliza el nombre de cada uno según tu rutina.
            </Text>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Días */}
            {days.map((day, index) => (
              <View key={day.id} style={styles.dayCard}>
                <View style={styles.dayNumberBadge}>
                  <Text style={styles.dayNumberText}>{day.dayNumber}</Text>
                </View>
                <View style={styles.dayCardContent}>
                  <Text style={styles.dayLabel}>Día</Text>
                  <TextInput
                    value={day.name || ''}
                    onChangeText={(text) => updateDayName(day.id, text)}
                    placeholder={`Día ${day.dayNumber}`}
                    placeholderTextColor="#9CA3AF"
                    style={styles.dayInput}
                    autoComplete="off"
                    textContentType="none"
                  />
                </View>
                {days.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeDay(day.id)}
                    style={styles.deleteDayButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Agregar Día */}
            <TouchableOpacity
              onPress={addDay}
              style={styles.addDayButton}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#667eea" />
              <Text style={styles.addDayButtonText}>Agregar día</Text>
            </TouchableOpacity>

            {/* Total */}
            <Text style={styles.totalDaysText}>Total: {days.length} día{days.length !== 1 ? 's' : ''}</Text>
          </ScrollView>

          {/* Botones */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={() => {
                setShowDaysModal(false);
                setShowBasicModal(true);
              }}
              style={styles.previousButton}
              activeOpacity={0.8}
            >
              <Text style={styles.previousButtonText}>Anterior</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDaysNext}
              style={styles.continueButtonPurple}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonPurpleText}>Continuar</Text>
            </TouchableOpacity>
          </View>
      </View>
    </Modal>
  );

  // Paso 3: Pantalla de Ejercicios del Día
  const renderExercisesStep = () => {
    const currentDay = days[currentDayIndex];
    if (!currentDay) return null;

    const totalSets = currentDay.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

    return (
      <Modal
        visible={currentStep === 'exercises'}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={handleExerciseStepBack}
        statusBarTranslucent
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top || 0, paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleExerciseStepBack} style={styles.backIconButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{currentDay.name}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressSteps}>
              <View style={[styles.progressStep, styles.progressStepCompleted]}>
                <Text style={styles.progressStepNumber}>1</Text>
              </View>
              <View style={styles.progressLineCompleted} />
              <View style={[styles.progressStep, styles.progressStepActive]}>
                <Text style={styles.progressStepNumber}>2</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <Text style={styles.progressStepNumber}>3</Text>
              </View>
            </View>
            <Text style={styles.progressLabel}>Agregar Ejercicios</Text>
          </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="barbell" size={24} color="#10B981" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryText}>
              {currentDay.exercises.length} ejercicio{currentDay.exercises.length !== 1 ? 's' : ''} agregado{currentDay.exercises.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.summaryText}>{totalSets} series totales</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Ejercicios */}
          {currentDay.exercises.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseNumberBadge}>
                <Text style={styles.exerciseNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.exerciseCardContent}>
                <View style={styles.exerciseCardHeader}>
                  <View style={styles.exerciseCardTitleContainer}>
                    <Text style={styles.exerciseCardTitle}>
                      {exercise.exercise?.name || 'Ejercicio'}
                    </Text>
                    <Text style={styles.exerciseCardType}>
                      {exercise.exercise?.muscleGroups[0] || 'General'} • Compuesto
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.exerciseMenuButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Tabla de Series */}
                <View style={styles.setsTable}>
                  <View style={styles.setsTableHeader}>
                    <Text style={styles.setsTableHeaderText}>Peso</Text>
                    <Text style={styles.setsTableHeaderText}>Reps</Text>
                    <Text style={styles.setsTableHeaderText}>RIR</Text>
                    <Text style={styles.setsTableHeaderText}>Descanso</Text>
                  </View>
                  {exercise.sets.map((set, setIndex) => (
                    <View key={set.id} style={styles.setsTableRow}>
                      <Text style={styles.setsTableCell}>
                        {set.weight ? `${set.weight}kg` : 'BW'}
                      </Text>
                      <Text style={styles.setsTableCell}>{set.repetitions || '-'}</Text>
                      <Text style={styles.setsTableCell}>{set.rir || '-'}</Text>
                      <Text style={styles.setsTableCell}>
                        {set.restTime ? `${set.restTime}s` : '-'}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Agregar Serie */}
                <TouchableOpacity 
                  style={styles.addSetButtonSmall}
                  onPress={() => {
                    setSelectedExercise(exercise.exercise || null);
                    setSets(exercise.sets);
                    setCurrentExerciseIndex(index);
                    setShowSetsModal(true);
                  }}
                >
                  <Ionicons name="add" size={20} color="#667eea" />
                  <Text style={styles.addSetButtonSmallText}>Agregar serie</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Agregar Ejercicio */}
          <TouchableOpacity
            onPress={openExerciseModal}
            style={styles.addExerciseButtonLarge}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#667eea" />
            <Text style={styles.addExerciseButtonLargeText}>Agregar Ejercicio</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={styles.exercisesFooter}>
          {!isEditing && (
            <TouchableOpacity
              onPress={handleExerciseStepBack}
              style={styles.saveButton}
              activeOpacity={0.8}
            >
              <Ionicons name="folder-outline" size={20} color="#1F2937" />
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleExerciseStepNext}
            style={[styles.nextDayButton, isEditing && styles.nextDayButtonFull]}
            activeOpacity={0.8}
          >
            <Text style={styles.nextDayButtonText}>
              {isEditing ? 'Revisar Rutina' : (currentDayIndex < days.length - 1 ? 'Siguiente Día' : 'Revisar Rutina')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    );
  };

  // Paso 4: Modal de Configurar Series
  const renderSetsModal = () => {
    if (!selectedExercise) return null;

    const getSetType = (index: number): 'warmup' | 'work' | 'max' => {
      if (index === 0) return 'warmup';
      if (index === sets.length - 1) return 'max';
      return 'work';
    };

    const getSetTypeLabel = (type: 'warmup' | 'work' | 'max'): string => {
      switch (type) {
        case 'warmup': return 'Calentamiento';
        case 'work': return 'Trabajo';
        case 'max': return 'Máximo';
        default: return 'Trabajo';
      }
    };

    const getSetTypeColor = (type: 'warmup' | 'work' | 'max'): string => {
      switch (type) {
        case 'warmup': return '#10B981';
        case 'work': return '#3B82F6';
        case 'max': return '#EF4444';
        default: return '#3B82F6';
      }
    };

    return (
      <Modal
        visible={showSetsModal}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowSetsModal(false);
          setSelectedExercise(null);
          setSets([]);
        }}
        statusBarTranslucent
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top || 0, paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowSetsModal(false);
                setSelectedExercise(null);
                setSets([]);
              }}
              style={styles.backIconButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressSteps}>
              <View style={[styles.progressStep, styles.progressStepCompleted]}>
                <Text style={styles.progressStepNumber}>1</Text>
              </View>
              <View style={styles.progressLineCompleted} />
              <View style={[styles.progressStep, styles.progressStepActive]}>
                <Text style={styles.progressStepNumber}>2</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <Text style={styles.progressStepNumber}>3</Text>
              </View>
            </View>
            <Text style={styles.progressLabel}>Configurar Series</Text>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Exercise Details Card */}
            <View style={styles.exerciseDetailsCard}>
              <View style={styles.exerciseDetailsIcon}>
                <Ionicons name="barbell" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.exerciseDetailsContent}>
                <Text style={styles.exerciseDetailsName}>{selectedExercise.name}</Text>
                <Text style={styles.exerciseDetailsDescription}>
                  {selectedExercise.description || 'Ejercicio compuesto para desarrollo muscular'}
                </Text>
                <View style={styles.exerciseDetailsTags}>
                  <View style={styles.exerciseTag}>
                    <Text style={styles.exerciseTagText}>
                      {selectedExercise.muscleGroups[0] || 'General'}
                    </Text>
                  </View>
                  <View style={[styles.exerciseTag, { backgroundColor: '#E5E7EB' }]}>
                    <Text style={[styles.exerciseTagText, { color: '#6B7280' }]}>Compuesto</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Number of Sets */}
            <View style={styles.numberOfSetsCard}>
              <View>
                <Text style={styles.numberOfSetsTitle}>Número de series</Text>
                <Text style={styles.numberOfSetsSubtitle}>Define cuántas series realizarás</Text>
              </View>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  onPress={() => {
                    if (numberOfSets > 1) {
                      setNumberOfSets(numberOfSets - 1);
                      setSets(sets.slice(0, -1));
                    }
                  }}
                  style={styles.counterButton}
                >
                  <Ionicons name="remove" size={20} color="#667eea" />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{numberOfSets}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setNumberOfSets(numberOfSets + 1);
                    addSet();
                  }}
                  style={styles.counterButton}
                >
                  <Ionicons name="add" size={20} color="#667eea" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Series Configuration */}
            <View style={styles.setsConfigSection}>
              <View style={styles.setsConfigHeader}>
                <Text style={styles.setsConfigTitle}>Configuración de Series</Text>
                <TouchableOpacity onPress={copyToAll}>
                  <Text style={styles.copyToAllText}>Copiar a todas</Text>
                </TouchableOpacity>
              </View>

              {sets.map((set, index) => {
                const setType = getSetType(index);
                return (
                  <View key={set.id} style={styles.setConfigCard}>
                    <View style={styles.setConfigCardHeader}>
                      <Text style={styles.setConfigCardTitle}>Serie {index + 1}</Text>
                      <View style={[styles.setTypeBadge, { backgroundColor: getSetTypeColor(setType) }]}>
                        <Text style={styles.setTypeBadgeText}>{getSetTypeLabel(setType)}</Text>
                      </View>
                    </View>
                    <View style={styles.setConfigFields}>
                      <View style={styles.setConfigField}>
                        <Text style={styles.setConfigFieldLabel}>Repeticiones</Text>
                        <View style={styles.setConfigInputContainer}>
                          <TextInput
                            value={set.repetitions?.toString() || ''}
                            onChangeText={(text) => updateSet(set.id, 'repetitions', parseInt(text) || 0)}
                            keyboardType="numeric"
                            style={styles.setConfigInput}
                            placeholder="12"
                          />
                          <Text style={styles.setConfigUnit}>reps</Text>
                        </View>
                      </View>
                      <View style={styles.setConfigField}>
                        <Text style={styles.setConfigFieldLabel}>Peso</Text>
                        <View style={styles.setConfigInputContainer}>
                          <TextInput
                            value={set.weight?.toString() || ''}
                            onChangeText={(text) => updateSet(set.id, 'weight', parseFloat(text) || 0)}
                            keyboardType="numeric"
                            style={styles.setConfigInput}
                            placeholder="60"
                          />
                          <Text style={styles.setConfigUnit}>kg</Text>
                        </View>
                      </View>
                      <View style={styles.setConfigField}>
                        <Text style={styles.setConfigFieldLabel}>Descanso</Text>
                        <View style={styles.setConfigInputContainer}>
                          <TextInput
                            value={set.restTime?.toString() || ''}
                            onChangeText={(text) => updateSet(set.id, 'restTime', parseInt(text) || 90)}
                            keyboardType="numeric"
                            style={styles.setConfigInput}
                            placeholder="90"
                          />
                          <Text style={styles.setConfigUnit}>seg</Text>
                        </View>
                      </View>
                      <View style={styles.setConfigField}>
                        <Text style={styles.setConfigFieldLabel}>RIR</Text>
                        <View style={styles.setConfigInputContainer}>
                          <TextInput
                            value={set.rir?.toString() || ''}
                            onChangeText={(text) => updateSet(set.id, 'rir', text ? parseInt(text) : undefined)}
                            keyboardType="numeric"
                            style={styles.setConfigInput}
                            placeholder="2"
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.setsModalFooter}>
            <TouchableOpacity
              onPress={handleSetsSave}
              style={styles.setsModalSaveButton}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.setsModalSaveText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Paso 5: Revisar Rutina
  const renderReviewStep = () => {
    const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const dayColors = ['#3B82F6', '#10B981', '#8B5CF6', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

    return (
      <Modal
        visible={showReviewModal && currentStep === 'review'}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={handleReviewBack}
        statusBarTranslucent
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top || 0, paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleReviewBack} style={styles.backIconButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Revisar Rutina</Text>
            <View style={{ width: 40 }} />
          </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressSteps}>
            <View style={[styles.progressStep, styles.progressStepCompleted]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.progressLineCompleted} />
            <View style={[styles.progressStep, styles.progressStepCompleted]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.progressLineCompleted} />
            <View style={[styles.progressStep, styles.progressStepActive]}>
              <Text style={styles.progressStepNumber}>3</Text>
            </View>
          </View>
          <Text style={styles.progressLabel}>Revisar y Confirmar</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Summary Card */}
          <View style={styles.reviewSummaryCard}>
            <Text style={styles.reviewSummaryTitle}>{routineName}</Text>
            <Text style={styles.reviewSummaryDescription}>
              {description || 'Rutina de entrenamiento personalizada'}
            </Text>
            <View style={styles.reviewSummaryStats}>
              <View style={styles.reviewSummaryStat}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.reviewSummaryStatText}>{days.length} días</Text>
              </View>
              <View style={styles.reviewSummaryStat}>
                <Ionicons name="barbell-outline" size={16} color="#6B7280" />
                <Text style={styles.reviewSummaryStatText}>{getTotalExercises()} ejercicios</Text>
              </View>
              <View style={styles.reviewCompleteBadge}>
                <Text style={styles.reviewCompleteBadgeText}>Completo</Text>
              </View>
            </View>
          </View>

          {/* Days Cards */}
          {days.map((day, index) => {
            const totalSets = day.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
            const isExpanded = selectedReviewDay === index;
            return (
              <View key={day.id}>
                <TouchableOpacity
                  style={styles.reviewDayCard}
                  activeOpacity={0.7}
                  onPress={() => setSelectedReviewDay(isExpanded ? null : index)}
                >
                  <View style={[styles.reviewDayBadge, { backgroundColor: dayColors[index % dayColors.length] }]}>
                    <Text style={styles.reviewDayBadgeText}>{dayLabels[index % dayLabels.length]}</Text>
                  </View>
                  <View style={styles.reviewDayContent}>
                    <Text style={styles.reviewDayTitle}>{day.name}</Text>
                    <Text style={styles.reviewDayStats}>
                      {day.exercises.length} ejercicio{day.exercises.length !== 1 ? 's' : ''}, {totalSets} series
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(index);
                    }}
                    style={styles.reviewDayEditButton}
                  >
                    <Ionicons name="pencil-outline" size={18} color="#667eea" />
                  </TouchableOpacity>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" style={styles.reviewDayChevron} />
                </TouchableOpacity>
                
                {/* Expanded Day Details */}
                {isExpanded && (
                  <View style={styles.reviewDayExpanded}>
                    {day.exercises.map((exercise, exIndex) => (
                      <View key={exercise.id} style={styles.reviewExerciseCard}>
                        <Text style={styles.reviewExerciseTitle}>
                          {exIndex + 1}. {exercise.exercise?.name || 'Ejercicio'}
                        </Text>
                        <View style={styles.reviewSetsTable}>
                          <View style={styles.reviewSetsTableHeader}>
                            <Text style={styles.reviewSetsTableHeaderText}>Peso</Text>
                            <Text style={styles.reviewSetsTableHeaderText}>Reps</Text>
                            <Text style={styles.reviewSetsTableHeaderText}>RIR</Text>
                            <Text style={styles.reviewSetsTableHeaderText}>Descanso</Text>
                          </View>
                          {exercise.sets.map((set) => (
                            <View key={set.id} style={styles.reviewSetsTableRow}>
                              <Text style={styles.reviewSetsTableCell}>
                                {set.weight ? `${set.weight}kg` : 'BW'}
                              </Text>
                              <Text style={styles.reviewSetsTableCell}>{set.repetitions || '-'}</Text>
                              <Text style={styles.reviewSetsTableCell}>{set.rir || '-'}</Text>
                              <Text style={styles.reviewSetsTableCell}>
                                {set.restTime ? `${set.restTime}s` : '-'}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={styles.reviewFooter}>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={saving}
            style={styles.reviewConfirmButton}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.reviewConfirmButtonText}>Confirmar Rutina</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    );
  };

  // Modal de Selección de Ejercicios
  const renderExerciseSelectionModal = () => (
    <Modal
      visible={showExerciseModal}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowExerciseModal(false)}
      statusBarTranslucent
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top || 0, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Seleccionar Ejercicio</Text>
          <TouchableOpacity
            onPress={() => setShowExerciseModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={theme.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.text.tertiary} style={styles.searchIcon} />
          <TextInput
            value={exerciseSearchQuery}
            onChangeText={setExerciseSearchQuery}
            placeholder="Buscar ejercicio"
            placeholderTextColor={theme.text.tertiary}
            style={styles.searchInput}
            autoComplete="off"
            textContentType="none"
          />
        </View>

        {loadingExercises ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary.main} />
          </View>
        ) : (
          <ScrollView style={styles.modalContent}>
            {filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                onPress={() => selectExercise(exercise)}
                style={styles.exerciseOption}
                activeOpacity={0.7}
              >
                <Text style={styles.exerciseOptionName}>{exercise.name}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.text.tertiary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderBasicModal()}
      {renderDaysModal()}
      {currentStep === 'exercises' && renderExercisesStep()}
      {currentStep === 'review' && renderReviewStep()}
      {renderExerciseSelectionModal()}
      {renderSetsModal()}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => {
          setToast({
            visible: false,
            message: toast.message || '',
            type: toast.type || 'info',
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContentLarge: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  backIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Progress Indicator
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepActive: {
    backgroundColor: '#667eea',
  },
  progressStepCompleted: {
    backgroundColor: '#667eea',
  },
  progressStepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  progressLineCompleted: {
    flex: 1,
    height: 2,
    backgroundColor: '#667eea',
    marginHorizontal: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#667eea',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  progressBarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  // Inputs
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  inputIconRight: {
    marginLeft: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  textAreaContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  textArea: {
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
  },
  textAreaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Tips
  tipsContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
  tipsList: {
    flexDirection: 'column',
  },
  tipItem: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  // Preview
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  previewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewStatText: {
    fontSize: 14,
    color: '#6B7280',
  },
  previewBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  // Days
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayNumberBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dayNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dayCardContent: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dayInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginTop: 4,
  },
  deleteDayButton: {
    padding: 8,
  },
  addDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#667eea',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  addDayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  totalDaysText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Buttons
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 20,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  continueButtonPurple: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  continueButtonPurpleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  previousButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 12,
  },
  previousButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  // Exercises Step
  exercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  exercisesHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  exercisesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  durationContainer: {
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  durationLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exerciseNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exerciseCardContent: {
    flex: 1,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseCardTitleContainer: {
    flex: 1,
  },
  exerciseCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  exerciseCardType: {
    fontSize: 12,
    color: '#6B7280',
  },
  exerciseMenuButton: {
    padding: 4,
  },
  setsTable: {
    marginBottom: 12,
  },
  setsTableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  setsTableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  setsTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  setsTableCell: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
  },
  addSetButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#667eea',
    borderRadius: 8,
    padding: 8,
  },
  addSetButtonSmallText: {
    fontSize: 14,
    color: '#667eea',
  },
  addExerciseButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#667eea',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  addExerciseButtonLargeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  exercisesFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  nextDayButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  nextDayButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nextDayButtonFull: {
    flex: 1,
  },
  // Sets Modal
  exerciseDetailsCard: {
    flexDirection: 'row',
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  exerciseDetailsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  exerciseDetailsContent: {
    flex: 1,
  },
  exerciseDetailsName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exerciseDetailsDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  exerciseDetailsTags: {
    flexDirection: 'row',
  },
  exerciseTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  numberOfSetsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  numberOfSetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  numberOfSetsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    minWidth: 30,
    textAlign: 'center',
  },
  setsConfigSection: {
    marginBottom: 20,
  },
  setsConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  setsConfigTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  copyToAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  setConfigCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  setConfigCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  setConfigCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  setTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  setTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  setConfigFields: {
    flexDirection: 'column',
  },
  setConfigField: {
    marginBottom: 8,
  },
  setConfigFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  setConfigInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  setConfigInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  setConfigUnit: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  setsModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  setsModalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
  },
  setsModalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  setsModalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 12,
    flex: 1,
  },
  setsModalSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  // Review Step
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  editIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewSummaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  reviewSummaryDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  reviewSummaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewSummaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewSummaryStatText: {
    fontSize: 14,
    color: '#6B7280',
  },
  reviewCompleteBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewCompleteBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewDayBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reviewDayBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reviewDayContent: {
    flex: 1,
  },
  reviewDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  reviewDayStats: {
    fontSize: 14,
    color: '#6B7280',
  },
  reviewDayEditButton: {
    padding: 8,
    marginRight: 8,
  },
  reviewDayChevron: {
    marginLeft: 4,
  },
  reviewDayExpanded: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  reviewExerciseCard: {
    marginBottom: 16,
  },
  reviewExerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  reviewSetsTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  reviewSetsTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reviewSetsTableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  reviewSetsTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reviewSetsTableCell: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
  },
  reviewFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reviewEditButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  reviewEditButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewConfirmButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  reviewConfirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Exercise Selection Modal
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  exerciseOptionName: {
    fontSize: 16,
    color: '#1F2937',
  },
});
