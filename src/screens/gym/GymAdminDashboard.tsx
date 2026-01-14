// Dashboard premium del Admin del Gym
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { PersonUser } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from '../../components/LoadingScreen';
import { theme } from '../../config/theme';

interface GymMetrics {
  totalStudents: number;
  totalProfessors: number;
  studentsWithoutProfessor: number;
  professorsWithoutStudents: number;
  students: PersonUser[];
  professors: PersonUser[];
}

interface GymAdminDashboardProps {
  onNavigateToSearch?: () => void;
}

export default function GymAdminDashboard({ onNavigateToSearch }: GymAdminDashboardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<GymMetrics>({
    totalStudents: 0,
    totalProfessors: 0,
    studentsWithoutProfessor: 0,
    professorsWithoutStudents: 0,
    students: [],
    professors: [],
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    if (!user || user.userType !== 'gym' || !user.gymId) return;

    try {
      setLoading(true);
      const [students, professors] = await Promise.all([
        userService.getGymStudents(user.gymId),
        userService.getGymProfessors(user.gymId),
      ]);

      const studentsWithoutProfessor = students.filter(
        (s) => !s.professorId
      ).length;

      const professorsWithoutStudents = professors.filter((prof) => {
        const hasStudents = students.some((s) => s.professorId === prof.id);
        return !hasStudents;
      }).length;

      setMetrics({
        totalStudents: students.length,
        totalProfessors: professors.length,
        studentsWithoutProfessor,
        professorsWithoutStudents,
        students,
        professors,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingScreen message="Cargando métricas..." color={theme.primary.main} icon="stats-chart-outline" />;
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background.primary }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary.main} />
      }
    >
      <View style={{ padding: theme.spacing.xl }}>
        {/* Header Section */}
        <View style={{ marginBottom: theme.spacing.xxxl }}>
          <Text
            style={{
              ...theme.typography.h1,
              color: theme.text.primary,
              marginBottom: 6,
            }}
          >
            Dashboard
          </Text>
          <Text
            style={{
              ...theme.typography.body,
              color: theme.text.secondary,
            }}
          >
            Resumen de tu gimnasio
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: theme.spacing.xxxl }}>
          <Text
            style={{
              ...theme.typography.h3,
              color: theme.text.primary,
              marginBottom: theme.spacing.lg,
            }}
          >
            Acciones Rápidas
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <TouchableOpacity
              onPress={() => {
                if (onNavigateToSearch) {
                  onNavigateToSearch();
                }
              }}
              activeOpacity={0.85}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={theme.gradients.secondary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.xl,
                  shadowColor: theme.shadow.tertiary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      backgroundColor: theme.text.whiteAlpha[25],
                      borderRadius: theme.borderRadius.md,
                      width: 56,
                      height: 56,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: theme.spacing.md,
                    }}
                  >
                    <Ionicons name="school" size={26} color={theme.text.white} />
                  </View>
                  <Text
                    style={{
                      color: theme.text.white,
                      fontSize: theme.typography.body.fontSize,
                      fontWeight: '700',
                      marginBottom: 4,
                    }}
                  >
                    Agregar Profesor
                  </Text>
                  <Text
                    style={{
                      color: theme.text.whiteAlpha[90],
                      fontSize: theme.typography.small.fontSize,
                      fontWeight: theme.typography.small.fontWeight,
                    }}
                  >
                    Buscar e invitar
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (onNavigateToSearch) {
                  onNavigateToSearch();
                }
              }}
              activeOpacity={0.85}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={theme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.xl,
                  shadowColor: theme.shadow.secondary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      backgroundColor: theme.text.whiteAlpha[25],
                      borderRadius: theme.borderRadius.md,
                      width: 56,
                      height: 56,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: theme.spacing.md,
                    }}
                  >
                    <Ionicons name="people" size={26} color={theme.text.white} />
                  </View>
                  <Text
                    style={{
                      color: theme.text.white,
                      fontSize: theme.typography.body.fontSize,
                      fontWeight: '700',
                      marginBottom: 4,
                    }}
                  >
                    Agregar Alumno
                  </Text>
                  <Text
                    style={{
                      color: theme.text.whiteAlpha[90],
                      fontSize: theme.typography.small.fontSize,
                      fontWeight: theme.typography.small.fontWeight,
                    }}
                  >
                    Buscar e invitar
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Metrics */}
        <View style={{ marginBottom: theme.spacing.xxxl }}>
          <Text
            style={{
              ...theme.typography.h3,
              color: theme.text.primary,
              marginBottom: theme.spacing.lg,
            }}
          >
            Métricas Principales
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
            <View style={{ width: '50%', padding: theme.spacing.sm }}>
            <LinearGradient
              colors={theme.gradients.primary}
              style={{
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.xl,
                shadowColor: theme.shadow.secondary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
                  <View
                    style={{
                      backgroundColor: theme.text.whiteAlpha[20],
                      borderRadius: theme.borderRadius.md,
                      width: 44,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="people" size={22} color={theme.text.white} />
                  </View>
                  <Text
                    style={{
                      color: theme.text.whiteAlpha[90],
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    Alumnos
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: '800',
                    color: theme.text.white,
                    marginBottom: 4,
                    letterSpacing: -1,
                  }}
                >
                  {metrics.totalStudents}
                </Text>
                <Text
                  style={{
                    color: theme.text.whiteAlpha[80],
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: theme.typography.caption.fontWeight,
                  }}
                >
                  Total registrados
                </Text>
              </LinearGradient>
            </View>

            <View style={{ width: '50%', padding: theme.spacing.sm }}>
            <LinearGradient
              colors={theme.gradients.secondary}
              style={{
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.xl,
                shadowColor: theme.shadow.tertiary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
                  <View
                    style={{
                      backgroundColor: theme.text.whiteAlpha[20],
                      borderRadius: theme.borderRadius.md,
                      width: 44,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="school" size={22} color={theme.text.white} />
                  </View>
                  <Text
                    style={{
                      color: theme.text.whiteAlpha[90],
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    Profesores
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: '800',
                    color: theme.text.white,
                    marginBottom: 4,
                    letterSpacing: -1,
                  }}
                >
                  {metrics.totalProfessors}
                </Text>
                <Text
                  style={{
                    color: theme.text.whiteAlpha[80],
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: theme.typography.caption.fontWeight,
                  }}
                >
                  Total registrados
                </Text>
              </LinearGradient>
            </View>

            <View style={{ width: '50%', padding: theme.spacing.sm }}>
              <View
                style={{
                  backgroundColor: theme.background.secondary,
                  borderRadius: theme.borderRadius.xl,
                  padding: theme.spacing.xl,
                  borderLeftWidth: 4,
                  borderLeftColor: theme.accent.success,
                  shadowColor: theme.shadow.color,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
                  <View
                    style={{
                      backgroundColor: theme.iconBackground.light,
                      borderRadius: theme.borderRadius.md,
                      width: 44,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="person-remove" size={22} color={theme.accent.success} />
                  </View>
                  <Text
                    style={{
                      color: theme.text.secondary,
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    Sin Profesor
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: '800',
                    color: theme.accent.success,
                    marginBottom: 4,
                    letterSpacing: -0.5,
                  }}
                >
                  {metrics.studentsWithoutProfessor}
                </Text>
                <Text
                  style={{
                    color: theme.text.tertiary,
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: theme.typography.caption.fontWeight,
                  }}
                >
                  Alumnos sin asignar
                </Text>
              </View>
            </View>

            <View style={{ width: '50%', padding: theme.spacing.sm }}>
              <View
                style={{
                  backgroundColor: theme.background.secondary,
                  borderRadius: theme.borderRadius.xl,
                  padding: theme.spacing.xl,
                  borderLeftWidth: 4,
                  borderLeftColor: theme.accent.warning,
                  shadowColor: theme.shadow.color,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
                  <View
                    style={{
                      backgroundColor: theme.iconBackground.lighter,
                      borderRadius: theme.borderRadius.md,
                      width: 44,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="people-outline" size={22} color={theme.accent.warning} />
                  </View>
                  <Text
                    style={{
                      color: theme.text.secondary,
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    Sin Alumnos
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: '800',
                    color: theme.accent.warning,
                    marginBottom: 4,
                    letterSpacing: -0.5,
                  }}
                >
                  {metrics.professorsWithoutStudents}
                </Text>
                <Text
                  style={{
                    color: theme.text.tertiary,
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: theme.typography.caption.fontWeight,
                  }}
                >
                  Profesores sin asignar
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Students Without Professor */}
        {metrics.studentsWithoutProfessor > 0 && (
          <View
            style={{
              backgroundColor: theme.background.secondary,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.xl,
              marginBottom: theme.spacing.lg,
              shadowColor: theme.shadow.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <View
                style={{
                  backgroundColor: theme.iconBackground.light,
                  borderRadius: theme.borderRadius.md,
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: theme.spacing.md,
                }}
              >
                  <Ionicons name="alert-circle" size={20} color={theme.accent.success} />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: theme.text.primary,
                }}
              >
                Alumnos sin Profesor ({metrics.studentsWithoutProfessor})
              </Text>
            </View>
            {metrics.students
              .filter((s) => !s.professorId)
              .slice(0, 5)
              .map((student) => (
                <View
                  key={student.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: theme.spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.background.tertiary,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: theme.iconBackground.tertiary,
                      borderRadius: theme.borderRadius.md,
                      width: 40,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing.md,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.primary.main,
                        fontSize: 14,
                        fontWeight: '700',
                      }}
                    >
                      {student.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: theme.typography.body.fontSize,
                        fontWeight: '600',
                        color: theme.text.primary,
                        marginBottom: 2,
                      }}
                      numberOfLines={1}
                    >
                      {student.displayName}
                    </Text>
                    <Text
                      style={{
                        fontSize: theme.typography.caption.fontSize,
                        color: theme.text.secondary,
                      }}
                      numberOfLines={1}
                    >
                      {student.email}
                    </Text>
                  </View>
                </View>
              ))}
            {metrics.studentsWithoutProfessor > 5 && (
              <Text
                style={{
                  color: theme.text.secondary,
                  fontSize: 13,
                  textAlign: 'center',
                  marginTop: theme.spacing.md,
                  fontWeight: theme.typography.body.fontWeight,
                }}
              >
                +{metrics.studentsWithoutProfessor - 5} más
              </Text>
            )}
          </View>
        )}

        {/* Professors Without Students */}
        {metrics.professorsWithoutStudents > 0 && (
          <View
            style={{
              backgroundColor: theme.background.secondary,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.xl,
              marginBottom: theme.spacing.lg,
              shadowColor: theme.shadow.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <View
                style={{
                  backgroundColor: theme.iconBackground.lighter,
                  borderRadius: theme.borderRadius.md,
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: theme.spacing.md,
                }}
              >
                  <Ionicons name="information-circle" size={20} color={theme.accent.warning} />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: theme.text.primary,
                }}
              >
                Profesores sin Alumnos ({metrics.professorsWithoutStudents})
              </Text>
            </View>
            {metrics.professors
              .filter((prof) => {
                const hasStudents = metrics.students.some(
                  (s) => s.professorId === prof.id
                );
                return !hasStudents;
              })
              .slice(0, 5)
              .map((professor) => (
                <View
                  key={professor.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: theme.spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.background.tertiary,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: theme.iconBackground.quaternary,
                      borderRadius: theme.borderRadius.md,
                      width: 40,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing.md,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.primary.light,
                        fontSize: 14,
                        fontWeight: '700',
                      }}
                    >
                      {professor.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: theme.typography.body.fontSize,
                        fontWeight: '600',
                        color: theme.text.primary,
                        marginBottom: 2,
                      }}
                      numberOfLines={1}
                    >
                      {professor.displayName}
                    </Text>
                    <Text
                      style={{
                        fontSize: theme.typography.caption.fontSize,
                        color: theme.text.secondary,
                      }}
                      numberOfLines={1}
                    >
                      {professor.email}
                    </Text>
                  </View>
                </View>
              ))}
            {metrics.professorsWithoutStudents > 5 && (
              <Text
                style={{
                  color: theme.text.secondary,
                  fontSize: 13,
                  textAlign: 'center',
                  marginTop: theme.spacing.md,
                  fontWeight: theme.typography.body.fontWeight,
                }}
              >
                +{metrics.professorsWithoutStudents - 5} más
              </Text>
            )}
          </View>
        )}

        {/* Refresh Button */}
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          activeOpacity={0.85}
          style={{
            marginTop: 8,
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={theme.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: theme.borderRadius.lg,
              paddingVertical: theme.spacing.lg,
              alignItems: 'center',
            }}
          >
            {refreshing ? (
              <ActivityIndicator color={theme.text.white} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="refresh" size={20} color={theme.text.white} style={{ marginRight: theme.spacing.sm }} />
                <Text
                  style={{
                    color: theme.text.white,
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  Actualizar Métricas
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
