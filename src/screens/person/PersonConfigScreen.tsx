// Pantalla de configuración para usuario persona - Máximos personales
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
  StyleSheet,
} from 'react-native';
import { Exercise, PersonalMax } from '../../types';
import { exerciseService } from '../../services/exerciseService';
import { personalMaxService } from '../../services/personalMaxService';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import LoadingScreen from '../../components/LoadingScreen';
import PageHeader from '../../components/PageHeader';

export default function PersonConfigScreen() {
  const { user } = useAuth();
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
      Alert.alert('Error', 'No se pudieron cargar los datos');
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
      Alert.alert('Error', 'El peso máximo es obligatorio');
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
      Alert.alert('Éxito', 'Máximo personal guardado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el máximo');
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
      <PageHeader icon="settings-outline" />
      <ScrollView
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
            placeholder="Buscar ejercicio..."
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

        {/* Lista de ejercicios */}
        {filteredExercises.length === 0 ? (
          <View style={{
            backgroundColor: theme.background.secondary,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing.xxxl * 2,
            alignItems: 'center',
          }}>
            <Ionicons name="fitness-outline" size={48} color={theme.text.tertiary} />
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.text.primary,
              marginTop: theme.spacing.lg,
            }}>
              No se encontraron ejercicios
            </Text>
          </View>
        ) : (
          filteredExercises.map((exercise) => {
            const max = getMaxForExercise(exercise.id);
            return (
              <TouchableOpacity
                key={exercise.id}
                onPress={() => openModal(exercise)}
                style={{
                  backgroundColor: theme.background.secondary,
                  borderRadius: theme.borderRadius.xl,
                  padding: theme.spacing.xl,
                  marginBottom: theme.spacing.lg,
                  shadowColor: theme.shadow.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 4,
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 17,
                      fontWeight: '700',
                      color: theme.text.primary,
                      marginBottom: 4,
                    }}>
                      {exercise.name}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {exercise.muscleGroups.slice(0, 3).map((group, idx) => (
                        <View
                          key={idx}
                          style={{
                            backgroundColor: theme.iconBackground.tertiary,
                            borderRadius: theme.borderRadius.md,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}
                        >
                          <Text style={{
                            fontSize: 11,
                            color: theme.primary.main,
                            fontWeight: '600',
                          }}>
                            {group}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  {max ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{
                        fontSize: 20,
                        fontWeight: '800',
                        color: theme.primary.main,
                      }}>
                        {max.maxWeight} kg
                      </Text>
                      {max.maxReps && (
                        <Text style={{
                          fontSize: 12,
                          color: theme.text.secondary,
                        }}>
                          {max.maxReps} reps
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Ionicons name="add-circle-outline" size={24} color={theme.text.tertiary} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal para editar máximo */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => !saving && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xl }}>
              <Text style={{
                fontSize: 22,
                fontWeight: '700',
                color: theme.text.primary,
              }}>
                {selectedExercise?.name}
              </Text>
              <TouchableOpacity
                onPress={() => !saving && setModalVisible(false)}
                disabled={saving}
                style={{
                  backgroundColor: theme.background.tertiary,
                  borderRadius: theme.borderRadius.xl,
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: theme.spacing.xl }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: theme.text.primary,
                marginBottom: theme.spacing.sm,
              }}>
                Peso Máximo (kg) *
              </Text>
              <TextInput
                placeholder="Ej: 100"
                placeholderTextColor={theme.text.tertiary}
                value={maxWeight}
                onChangeText={setMaxWeight}
                keyboardType="numeric"
                style={{
                  backgroundColor: theme.background.tertiary,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.lg,
                  fontSize: 16,
                  color: theme.text.primary,
                }}
              />
            </View>

            <View style={{ marginBottom: theme.spacing.xl }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: theme.text.primary,
                marginBottom: theme.spacing.sm,
              }}>
                Repeticiones Máximas (opcional)
              </Text>
              <TextInput
                placeholder="Ej: 10"
                placeholderTextColor={theme.text.tertiary}
                value={maxReps}
                onChangeText={setMaxReps}
                keyboardType="numeric"
                style={{
                  backgroundColor: theme.background.tertiary,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.lg,
                  fontSize: 16,
                  color: theme.text.primary,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ marginTop: theme.spacing.lg }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.gradients.primary}
                style={{
                  borderRadius: theme.borderRadius.lg,
                  paddingVertical: theme.spacing.lg,
                  alignItems: 'center',
                }}
              >
                {saving ? (
                  <ActivityIndicator color={theme.text.white} />
                ) : (
                  <Text style={{
                    color: theme.text.white,
                    fontSize: 16,
                    fontWeight: '700',
                  }}>
                    Guardar
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.background.secondary,
    borderTopLeftRadius: theme.borderRadius.xl * 1.5,
    borderTopRightRadius: theme.borderRadius.xl * 1.5,
    padding: theme.spacing.xl,
    maxHeight: '80%',
  },
});
