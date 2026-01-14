// Pantalla de rutinas del alumno - Unificada con rutinas propias y asignadas
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { routineService } from '../../services/routineService';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from '../../components/LoadingScreen';
import PageHeader from '../../components/PageHeader';
import { theme } from '../../config/theme';

type StudentRoutinesStackParamList = {
  StudentRoutinesHome: undefined;
  Workout: { routineId: string; isPersonal?: boolean };
  CreateRoutine: undefined;
};

type StudentNavigationProp = NativeStackNavigationProp<
  StudentRoutinesStackParamList,
  'StudentRoutinesHome'
>;

interface RoutineItem {
  id: string;
  name: string;
  description?: string;
  days: any[];
  status?: 'active' | 'completed' | 'paused';
  isPersonal: boolean;
}

export default function StudentRoutinesScreen() {
  const navigation = useNavigation<StudentNavigationProp>();
  const { user } = useAuth();
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutines();
    const unsubscribe = navigation.addListener('focus', () => {
      loadRoutines();
    });
    return unsubscribe;
  }, [navigation, user]);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      // Cargar rutinas asignadas
      const assignedRoutines = await routineService.getStudentRoutines(user.id);
      
      // Cargar rutinas propias (donde professorId = userId y no tiene gymId)
      const personalRoutines = await routineService.getProfessorRoutines(user.id);
      const personalOnly = personalRoutines
        .filter((r) => !r.gymId)
        .map((r) => ({
          ...r,
          isPersonal: true,
          status: 'active' as const,
        }));

      // Combinar y marcar rutinas asignadas
      const allRoutines: RoutineItem[] = [
        ...assignedRoutines.map((r) => ({ ...r, isPersonal: false })),
        ...personalOnly,
      ];

      setRoutines(allRoutines);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = (routine: RoutineItem) => {
    navigation.navigate('Workout', {
      routineId: routine.id,
      isPersonal: routine.isPersonal,
    });
  };

  if (loading) {
    return <LoadingScreen message="Cargando rutinas..." color={theme.primary.main} icon="fitness-outline" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
      <PageHeader icon="fitness-outline" />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl }}>
        {/* Botón para crear rutina propia */}
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateRoutine' as any)}
          style={[
            styles.createButton,
            {
              backgroundColor: theme.background.secondary,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.xl,
              marginBottom: theme.spacing.xl,
              shadowColor: theme.shadow.secondary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 5,
            }
          ]}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.gradients.primary}
            style={{
              borderRadius: theme.borderRadius.xl,
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.lg,
            }}
          >
            <Ionicons name="add" size={28} color={theme.text.white} />
          </LinearGradient>
          <Text style={{ color: theme.primary.main, fontWeight: '700', fontSize: 18 }}>Crear Nueva Rutina</Text>
        </TouchableOpacity>

        {routines.length === 0 ? (
          <View style={{
            backgroundColor: theme.background.secondary,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing.xxxl * 1.5,
            alignItems: 'center',
            shadowColor: theme.shadow.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <LinearGradient
              colors={theme.gradients.primary}
              style={{
                borderRadius: theme.borderRadius.xl * 1.2,
                width: 96,
                height: 96,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.xl,
              }}
            >
              <Ionicons name="fitness-outline" size={48} color={theme.text.white} />
            </LinearGradient>
            <Text style={{
              fontSize: 22,
              fontWeight: '700',
              color: theme.text.primary,
              marginBottom: 8,
            }}>
              No tienes rutinas
            </Text>
            <Text style={{
              color: theme.text.secondary,
              textAlign: 'center',
              marginBottom: theme.spacing.xl,
            }}>
              Crea tu primera rutina o espera a que tu profesor te asigne una
            </Text>
          </View>
        ) : (
          routines.map((routine) => (
            <View
              key={routine.id}
              style={{
                backgroundColor: theme.background.secondary,
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.xl,
                marginBottom: theme.spacing.lg,
                shadowColor: theme.shadow.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: theme.text.primary,
                    marginBottom: 4,
                  }}>
                    {routine.name}
                  </Text>
                  {routine.description && (
                    <Text style={{
                      color: theme.text.secondary,
                      fontSize: 14,
                      marginBottom: 12,
                    }} numberOfLines={2}>
                      {routine.description}
                    </Text>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <View style={{
                      backgroundColor: theme.iconBackground.light,
                      borderRadius: theme.borderRadius.xl,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      marginRight: 8,
                    }}>
                      <Text style={{
                        color: theme.accent.success,
                        fontSize: 11,
                        fontWeight: '700',
                      }}>
                        {routine.days.length} {routine.days.length === 1 ? 'día' : 'días'}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: routine.isPersonal ? theme.iconBackground.tertiary : theme.iconBackground.light,
                      borderRadius: theme.borderRadius.xl,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      marginRight: 8,
                    }}>
                      <Text style={{
                        color: routine.isPersonal ? theme.primary.main : theme.accent.info,
                        fontSize: 11,
                        fontWeight: '700',
                      }}>
                        {routine.isPersonal ? 'Personal' : 'Asignada'}
                      </Text>
                    </View>
                    {routine.status && (
                      <View style={{
                        backgroundColor: routine.status === 'active'
                          ? theme.iconBackground.light
                          : routine.status === 'completed'
                          ? theme.iconBackground.secondary
                          : theme.iconBackground.tertiary,
                        borderRadius: theme.borderRadius.xl,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                      }}>
                        <Text style={{
                          color: routine.status === 'active'
                            ? theme.accent.success
                            : routine.status === 'completed'
                            ? theme.accent.info
                            : theme.text.tertiary,
                          fontSize: 11,
                          fontWeight: '700',
                        }}>
                          {routine.status === 'active'
                            ? 'Activa'
                            : routine.status === 'completed'
                            ? 'Completada'
                            : 'Pausada'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={() => handleStartWorkout(routine)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={theme.gradients.primary}
                  style={{
                    borderRadius: theme.borderRadius.lg,
                    paddingVertical: theme.spacing.lg,
                    paddingHorizontal: theme.spacing.xl,
                    alignItems: 'center',
                    marginTop: theme.spacing.md,
                    shadowColor: theme.primary.main,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="play-circle" size={24} color={theme.text.white} style={{ marginRight: 8 }} />
                    <Text style={{ color: theme.text.white, fontWeight: '700', fontSize: 16 }}>Iniciar Entrenamiento</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
