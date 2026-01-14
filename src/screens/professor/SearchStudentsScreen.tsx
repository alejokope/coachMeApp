// Pantalla para buscar alumnos del gym
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { PersonUser } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function SearchStudentsScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<PersonUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    if (!user || !user.gymId) return;

    try {
      setLoading(true);
      const gymStudents = await userService.getGymStudents(user.gymId);
      // Filtrar alumnos que no tienen profesor asignado o que no son del profesor actual
      const available = gymStudents.filter(
        (s) => !s.professorId || s.professorId !== user.id
      );
      setStudents(available);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los alumnos');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudent = async (student: PersonUser) => {
    if (!user) return;

    Alert.alert(
      'Asignar Alumno',
      `¿Quieres asignar a ${student.displayName} como tu alumno?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Asignar',
          onPress: async () => {
            try {
              setAssigning(student.id);
              const userRef = doc(db, 'users', student.id);
              await updateDoc(userRef, {
                professorId: user.id,
              });
              Alert.alert('Éxito', 'Alumno asignado correctamente');
              loadStudents();
            } catch (error) {
              Alert.alert('Error', 'No se pudo asignar el alumno');
            } finally {
              setAssigning(null);
            }
          },
        },
      ]
    );
  };

  const filteredStudents = students.filter((student) =>
    student.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Búsqueda */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Buscar Alumnos
          </Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre o email..."
            placeholderTextColor="#9CA3AF"
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
          />
        </View>

        {/* Lista de alumnos */}
        {loading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : filteredStudents.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Text className="text-6xl mb-4">👥</Text>
            <Text className="text-xl font-bold text-gray-800 mb-2">
              No hay alumnos disponibles
            </Text>
            <Text className="text-gray-500 text-center">
              {searchQuery
                ? 'No se encontraron alumnos con ese criterio'
                : 'No hay alumnos disponibles en tu gimnasio'}
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Alumnos Disponibles ({filteredStudents.length})
            </Text>
            {filteredStudents.map((student) => (
              <View
                key={student.id}
                className="flex-row items-center justify-between py-4 border-b border-gray-100"
              >
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">
                    {student.displayName}
                  </Text>
                  <Text className="text-gray-500 text-sm">{student.email}</Text>
                  {student.professorId && (
                    <Text className="text-orange-600 text-xs mt-1">
                      Tiene profesor asignado
                    </Text>
                  )}
                </View>
                {!student.professorId && (
                  <TouchableOpacity
                    onPress={() => handleAssignStudent(student)}
                    disabled={assigning === student.id}
                    className="bg-green-600 rounded-xl px-4 py-2"
                    activeOpacity={0.8}
                  >
                    {assigning === student.id ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text className="text-white font-semibold text-sm">
                        Asignar
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
