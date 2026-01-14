// Pantalla para asignar rutinas a alumnos
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Routine } from '../../types';
import { routineService } from '../../services/routineService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { PersonUser } from '../../types';

type ProfessorStackParamList = {
  AssignRoutine: { routineId: string; routineName?: string };
};

type AssignRoutineRouteProp = RouteProp<ProfessorStackParamList, 'AssignRoutine'>;
type AssignRoutineNavigationProp = NativeStackNavigationProp<
  ProfessorStackParamList,
  'AssignRoutine'
>;

export default function AssignRoutineScreen() {
  const route = useRoute<AssignRoutineRouteProp>();
  const navigation = useNavigation<AssignRoutineNavigationProp>();
  const { user } = useAuth();
  const { routineId } = route.params;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [students, setStudents] = useState<PersonUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user || !user.gymId) return;

    try {
      setLoading(true);
      // Cargar rutina
      const found = await routineService.getRoutineById(routineId);
      setRoutine(found);

      // Cargar mis alumnos
      const gymStudents = await userService.getGymStudents(user.gymId);
      const myStudents = gymStudents.filter(
        (s) => s.professorId === user.id
      );
      setStudents(myStudents);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (studentId: string) => {
    Alert.alert(
      'Asignar Rutina',
      `¿Asignar esta rutina al alumno?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Asignar',
          onPress: async () => {
            try {
              setAssigning(studentId);
              await routineService.assignRoutineToStudent(routineId, studentId);
              Alert.alert('Éxito', 'Rutina asignada correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo asignar la rutina');
            } finally {
              setAssigning(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!routine) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Rutina no encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            {routine.name}
          </Text>
          {routine.description && (
            <Text className="text-gray-600 mb-3">{routine.description}</Text>
          )}
          <View className="flex-row items-center">
            <View className="bg-green-100 rounded-full px-3 py-1 mr-2">
              <Text className="text-green-700 text-xs font-medium">
                {routine.days.length} {routine.days.length === 1 ? 'día' : 'días'}
              </Text>
            </View>
            <Text className="text-gray-500 text-sm">Plantilla</Text>
          </View>
        </View>

        <Text className="text-lg font-bold text-gray-800 mb-4">
          Seleccionar Alumno
        </Text>

        {students.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Text className="text-6xl mb-4">👥</Text>
            <Text className="text-xl font-bold text-gray-800 mb-2">
              No tienes alumnos asignados
            </Text>
            <Text className="text-gray-500 text-center">
              Asigna alumnos en la pestaña "Buscar" para poder asignarles rutinas
            </Text>
          </View>
        ) : (
          students.map((student) => (
            <TouchableOpacity
              key={student.id}
              onPress={() => handleAssign(student.id)}
              disabled={assigning === student.id}
              className="bg-white rounded-2xl p-5 mb-3 shadow-sm flex-row items-center"
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                <Text className="text-green-600 text-xl font-bold">
                  {student.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-800">
                  {student.displayName}
                </Text>
                <Text className="text-gray-600 text-sm">{student.email}</Text>
              </View>
              {assigning === student.id ? (
                <ActivityIndicator color="#10B981" />
              ) : (
                <View className="bg-green-600 rounded-lg px-4 py-2">
                  <Text className="text-white font-semibold">Asignar</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
