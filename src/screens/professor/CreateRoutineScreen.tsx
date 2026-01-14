// Pantalla de creación de rutina - Experiencia paso a paso inmersiva
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

type Step = 'name' | 'days' | 'exercises' | 'sets';

export default function CreateRoutineScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // Paso actual
  const [currentStep, setCurrentStep] = useState<Step>('name');
  
  // Datos básicos
  const [routineName, setRoutineName] = useState('');
  const [description, setDescription] = useState('');
  
  // Días
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [currentDayIndex, setCurrentDayIndex] = useState<number | null>(null);
  const [newDayName, setNewDayName] = useState('');
  
  // Ejercicios
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loadingExercises, setLoadingExercises] = useState(true);
  
  // Series
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  
  // Estados generales
  const [saving, setSaving] = useState(false);
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);

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
      Alert.alert('Error', 'No se pudieron cargar los ejercicios');
    } finally {
      setLoadingExercises(false);
    }
  };

  // ========== PASO 1: NOMBRE Y DESCRIPCIÓN ==========
  const handleNameStepNext = () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'El nombre de la rutina es obligatorio');
      return;
    }
    setCurrentStep('days');
  };

  // ========== PASO 2: AGREGAR DÍAS ==========
  const addDay = () => {
    if (!newDayName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para el día');
      return;
    }
    
    const newDay: RoutineDay = {
      id: `day-${Date.now()}`,
      dayNumber: days.length + 1,
      name: newDayName.trim(),
      exercises: [],
    };
    setDays([...days, newDay]);
    setNewDayName('');
  };

  const removeDay = (dayId: string) => {
    setDays(days.filter((d) => d.id !== dayId));
  };

  const handleDaysStepNext = () => {
    if (days.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos un día');
      return;
    }
    // Ir al primer día para agregar ejercicios
    setCurrentDayIndex(0);
    setCurrentStep('exercises');
  };

  // ========== PASO 3: AGREGAR EJERCICIOS ==========
  const openExerciseModal = () => {
    setExerciseSearchQuery('');
    setSelectedExercise(null);
    setSets([]);
    setCurrentSetIndex(0);
    setExerciseModalVisible(true);
  };

  const selectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    // Inicializar con una serie por defecto
    setSets([{
      id: `set-${Date.now()}`,
      repetitions: 10,
      weight: 0,
      restTime: 60,
    }]);
    setCurrentSetIndex(0);
  };

  const handleExerciseStepNext = () => {
    if (currentDayIndex === null) return;
    
    if (days[currentDayIndex].exercises.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos un ejercicio a este día');
      return;
    }
    
    // Si hay más días, continuar con el siguiente
    if (currentDayIndex < days.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
    } else {
      // Terminar y guardar
      handleSave();
    }
  };

  // ========== PASO 4: CONFIGURAR SERIES ==========
  const addSet = () => {
    const newSet: ExerciseSet = {
      id: `set-${Date.now()}`,
      repetitions: 10,
      weight: 0,
      restTime: 60,
    };
    setSets([...sets, newSet]);
    setCurrentSetIndex(sets.length);
  };

  const removeSet = (setId: string) => {
    const newSets = sets.filter((s) => s.id !== setId);
    setSets(newSets);
    if (currentSetIndex >= newSets.length) {
      setCurrentSetIndex(Math.max(0, newSets.length - 1));
    }
  };

  const updateSet = (setId: string, field: keyof ExerciseSet, value: any) => {
    setSets(sets.map((set) =>
      set.id === setId ? { ...set, [field]: value } : set
    ));
  };

  const handleSetStepNext = () => {
    if (sets.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos una serie');
      return;
    }
    
    if (!selectedExercise) return;
    
    const currentDay = days[currentDayIndex!];
    if (!currentDay) return;

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
    setExerciseModalVisible(false);
    setSelectedExercise(null);
    setSets([]);
    setCurrentSetIndex(0);
  };

  // ========== GUARDAR RUTINA ==========
  const handleSave = async () => {
    try {
      setSaving(true);
      const isPersonalRoutine = user?.userType === 'person' || user?.userType === 'student';
      const gymId = isPersonalRoutine ? null : ((user as any)?.gymId || null);
      
      const routineData: any = {
        name: routineName,
        professorId: user?.id || '',
        days,
        isTemplate: user?.userType === 'professor',
      };
      
      if (description && description.trim()) {
        routineData.description = description;
      }
      
      if (gymId) {
        routineData.gymId = gymId;
      }
      
      await routineService.createRoutine(routineData);

      Alert.alert('Éxito', 'Rutina creada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la rutina');
    } finally {
      setSaving(false);
    }
  };

  // ========== RENDERIZADO ==========
  const renderNameStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Paso 1: Información Básica</Text>
        <Text style={styles.stepSubtitle}>Comienza dando un nombre a tu rutina</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre de la Rutina *</Text>
        <TextInput
          value={routineName}
          onChangeText={setRoutineName}
          placeholder="Ej: Rutina de Fuerza Semanal"
          placeholderTextColor={theme.text.tertiary}
          style={styles.textInput}
          autoComplete="off"
          textContentType="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Descripción (Opcional)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe el objetivo de esta rutina..."
          placeholderTextColor={theme.text.tertiary}
          style={[styles.textInput, styles.textArea]}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          autoComplete="off"
          textContentType="none"
        />
      </View>

      <TouchableOpacity
        onPress={handleNameStepNext}
        style={styles.nextButton}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme.gradients.primary}
          style={styles.nextButtonGradient}
        >
          <Text style={styles.nextButtonText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={20} color={theme.text.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderDaysStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Paso 2: Agregar Días</Text>
        <Text style={styles.stepSubtitle}>
          {days.length === 0
            ? 'Agrega los días de tu rutina'
            : `${days.length} día${days.length > 1 ? 's' : ''} agregado${days.length > 1 ? 's' : ''}`}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre del Día</Text>
        <View style={styles.addRow}>
          <TextInput
            value={newDayName}
            onChangeText={setNewDayName}
            placeholder="Ej: Día 1 - Tren Superior"
            placeholderTextColor={theme.text.tertiary}
            style={[styles.textInput, { flex: 1, marginRight: theme.spacing.md }]}
            autoComplete="off"
            textContentType="none"
          />
          <TouchableOpacity
            onPress={addDay}
            style={styles.addButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={theme.gradients.primary}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={24} color={theme.text.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {days.length > 0 && (
        <View style={styles.listContainer}>
          {days.map((day, index) => (
            <View key={day.id} style={styles.dayCard}>
              <View style={styles.dayCardContent}>
                <Text style={styles.dayCardNumber}>{day.dayNumber}</Text>
                <Text style={styles.dayCardName}>{day.name}</Text>
                <Text style={styles.dayCardExercises}>
                  {day.exercises.length} ejercicio{day.exercises.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => removeDay(day.id)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          onPress={() => setCurrentStep('name')}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary.main} />
          <Text style={styles.backButtonText}>Atrás</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDaysStepNext}
          style={styles.nextButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.gradients.primary}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color={theme.text.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExercisesStep = () => {
    const currentDay = currentDayIndex !== null ? days[currentDayIndex] : null;
    if (!currentDay) return null;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>
            Paso 3: Ejercicios - {currentDay.name}
          </Text>
          <Text style={styles.stepSubtitle}>
            Día {currentDayIndex! + 1} de {days.length}
          </Text>
        </View>

        <TouchableOpacity
          onPress={openExerciseModal}
          style={styles.addExerciseButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.gradients.primary}
            style={styles.addExerciseButtonGradient}
          >
            <Ionicons name="add-circle" size={24} color={theme.text.white} />
            <Text style={styles.addExerciseButtonText}>Agregar Ejercicio</Text>
          </LinearGradient>
        </TouchableOpacity>

        {currentDay.exercises.length > 0 && (
          <View style={styles.listContainer}>
            {currentDay.exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseCardContent}>
                  <Text style={styles.exerciseCardName}>
                    {exercise.exercise?.name || 'Ejercicio'}
                  </Text>
                  <Text style={styles.exerciseCardSets}>
                    {exercise.sets.length} serie{exercise.sets.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            onPress={() => {
              if (currentDayIndex! > 0) {
                setCurrentDayIndex(currentDayIndex! - 1);
              } else {
                setCurrentStep('days');
                setCurrentDayIndex(null);
              }
            }}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={theme.primary.main} />
            <Text style={styles.backButtonText}>Atrás</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExerciseStepNext}
            style={styles.nextButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={theme.gradients.primary}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentDayIndex! < days.length - 1 ? 'Siguiente Día' : 'Finalizar'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={theme.text.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSetsModal = () => {
    if (!selectedExercise) return null;

    return (
      <Modal
        visible={exerciseModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setExerciseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
            <TouchableOpacity
              onPress={() => setExerciseModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.setsTitle}>Configurar Series</Text>

            {sets.map((set, index) => (
              <View key={set.id} style={styles.setCard}>
                <View style={styles.setCardHeader}>
                  <Text style={styles.setCardTitle}>Serie {index + 1}</Text>
                  {sets.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeSet(set.id)}
                      style={styles.removeSetButton}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.setInputsRow}>
                  <View style={styles.setInput}>
                    <Text style={styles.setLabel}>Repeticiones</Text>
                    <TextInput
                      value={set.repetitions?.toString() || ''}
                      onChangeText={(text) =>
                        updateSet(set.id, 'repetitions', parseInt(text) || 0)
                      }
                      keyboardType="numeric"
                      placeholder="10"
                      style={styles.setTextInput}
                    />
                  </View>
                  <View style={styles.setInput}>
                    <Text style={styles.setLabel}>Peso (kg)</Text>
                    <TextInput
                      value={set.weight?.toString() || ''}
                      onChangeText={(text) =>
                        updateSet(set.id, 'weight', parseFloat(text) || 0)
                      }
                      keyboardType="numeric"
                      placeholder="0"
                      style={styles.setTextInput}
                    />
                  </View>
                </View>

                <View style={styles.setInputsRow}>
                  <View style={styles.setInput}>
                    <Text style={styles.setLabel}>Descanso (seg)</Text>
                    <TextInput
                      value={set.restTime?.toString() || ''}
                      onChangeText={(text) =>
                        updateSet(set.id, 'restTime', parseInt(text) || 60)
                      }
                      keyboardType="numeric"
                      placeholder="60"
                      style={styles.setTextInput}
                    />
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={addSet}
              style={styles.addSetButton}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.primary.main} />
              <Text style={styles.addSetButtonText}>Agregar Serie</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={() => setExerciseModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSetStepNext}
              style={styles.confirmButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.gradients.primary}
                style={styles.confirmButtonGradient}
              >
                <Text style={styles.confirmButtonText}>Agregar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderExerciseSelectionModal = () => (
    <Modal
      visible={exerciseModalVisible && !selectedExercise}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setExerciseModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Seleccionar Ejercicio</Text>
          <TouchableOpacity
            onPress={() => setExerciseModalVisible(false)}
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
            placeholder="Buscar ejercicio..."
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
      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={theme.text.white} />
          <Text style={styles.savingText}>Guardando rutina...</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {currentStep === 'name' && renderNameStep()}
        {currentStep === 'days' && renderDaysStep()}
        {currentStep === 'exercises' && renderExercisesStep()}
      </ScrollView>

      {renderExerciseSelectionModal()}
      {renderSetsModal()}
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
  stepContainer: {
    padding: theme.spacing.xl,
  },
  stepHeader: {
    marginBottom: theme.spacing.xxl,
  },
  stepTitle: {
    ...theme.typography.h2,
    color: theme.text.primary,
    marginBottom: theme.spacing.sm,
  },
  stepSubtitle: {
    ...theme.typography.body,
    color: theme.text.secondary,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    ...theme.typography.body,
    color: theme.text.primary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.typography.body,
    color: theme.text.primary,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    marginTop: theme.spacing.lg,
  },
  dayCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCardContent: {
    flex: 1,
  },
  dayCardNumber: {
    ...theme.typography.caption,
    color: theme.primary.main,
    fontWeight: '700',
    marginBottom: 4,
  },
  dayCardName: {
    ...theme.typography.h3,
    color: theme.text.primary,
    marginBottom: 4,
  },
  dayCardExercises: {
    ...theme.typography.caption,
    color: theme.text.secondary,
  },
  removeButton: {
    padding: theme.spacing.sm,
  },
  exerciseCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseCardContent: {
    flex: 1,
  },
  exerciseCardName: {
    ...theme.typography.h3,
    color: theme.text.primary,
    marginBottom: 4,
  },
  exerciseCardSets: {
    ...theme.typography.caption,
    color: theme.text.secondary,
  },
  addExerciseButton: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  addExerciseButtonGradient: {
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExerciseButtonText: {
    ...theme.typography.h3,
    color: theme.text.white,
    marginLeft: theme.spacing.sm,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.primary.main,
  },
  backButtonText: {
    ...theme.typography.body,
    color: theme.primary.main,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  nextButton: {
    flex: 2,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    ...theme.typography.body,
    color: theme.text.white,
    fontWeight: '700',
    marginRight: theme.spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.background.tertiary,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.text.primary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.lg,
    margin: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.text.primary,
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxxl,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  exerciseOptionName: {
    ...theme.typography.body,
    color: theme.text.primary,
    fontWeight: '600',
  },
  setsTitle: {
    ...theme.typography.h3,
    color: theme.text.primary,
    marginBottom: theme.spacing.lg,
  },
  setCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  setCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  setCardTitle: {
    ...theme.typography.body,
    color: theme.text.primary,
    fontWeight: '700',
  },
  removeSetButton: {
    padding: theme.spacing.xs,
  },
  setInputsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  setInput: {
    flex: 1,
  },
  setLabel: {
    ...theme.typography.caption,
    color: theme.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  setTextInput: {
    backgroundColor: theme.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.text.primary,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.primary.main,
    borderStyle: 'dashed',
  },
  addSetButtonText: {
    ...theme.typography.body,
    color: theme.primary.main,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.background.tertiary,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.lg,
  },
  cancelButtonText: {
    ...theme.typography.body,
    color: theme.text.secondary,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    ...theme.typography.body,
    color: theme.text.white,
    fontWeight: '700',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  savingText: {
    ...theme.typography.body,
    color: theme.text.white,
    marginTop: theme.spacing.lg,
  },
});
