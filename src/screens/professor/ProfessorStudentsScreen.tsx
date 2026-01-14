// Pantalla de gestión de alumnos del profesor
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { PersonUser } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProfessorStackParamList = {
  ProfessorHome: undefined;
  StudentDetail: { studentId: string };
};

type ProfessorNavigationProp = NativeStackNavigationProp<
  ProfessorStackParamList,
  'ProfessorHome'
>;

export default function ProfessorStudentsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<ProfessorNavigationProp>();
  const [students, setStudents] = useState<PersonUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    if (!user || !user.gymId) return;

    try {
      setLoading(true);
      const gymStudents = await userService.getGymStudents(user.gymId);
      // Filtrar solo mis alumnos
      const myStudents = gymStudents.filter(
        (s) => s.professorId === user.id
      );
      setStudents(myStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-6 py-4">
      <View className="mb-4">
        <Text className="text-2xl font-bold text-gray-800 mb-1">
          Mis Alumnos
        </Text>
        <Text className="text-gray-600">
          {students.length} {students.length === 1 ? 'alumno' : 'alumnos'} asignados
        </Text>
      </View>

      {students.length === 0 ? (
        <View className="bg-white rounded-2xl p-8 items-center">
          <Text className="text-6xl mb-4">👨‍🎓</Text>
          <Text className="text-xl font-bold text-gray-800 mb-2">
            No tienes alumnos asignados
          </Text>
          <Text className="text-gray-500 text-center">
            Busca alumnos en la pestaña "Buscar" para asignarlos
          </Text>
        </View>
      ) : (
        students.map((student) => (
          <TouchableOpacity
            key={student.id}
            onPress={() => {
              navigation.navigate('StudentDetail' as any, { studentId: student.id });
            }}
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-800 mb-1">
                  {student.displayName}
                </Text>
                <Text className="text-gray-500 text-sm">{student.email}</Text>
              </View>
              <View className="bg-green-100 rounded-full px-3 py-1">
                <Text className="text-green-700 text-xs font-medium">
                  Ver Detalle
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
