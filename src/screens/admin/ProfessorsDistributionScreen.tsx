// Pantalla de distribución de profesores por gimnasio
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { gymService } from '../../services/gymService';
import { userService } from '../../services/userService';
import { Gym, PersonUser } from '../../types';

interface GymWithProfessors extends Gym {
  professors: PersonUser[];
  students: PersonUser[];
}

export default function ProfessorsDistributionScreen() {
  const [gyms, setGyms] = useState<GymWithProfessors[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const allGyms = await gymService.getAllGyms();

      const gymsWithData = await Promise.all(
        allGyms.map(async (gym) => {
          const [professors, students] = await Promise.all([
            userService.getGymProfessors(gym.id),
            userService.getGymStudents(gym.id),
          ]);

          return {
            ...gym,
            professors,
            students,
          };
        })
      );

      setGyms(gymsWithData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const selectedGymData = selectedGym
    ? gyms.find((g) => g.id === selectedGym)
    : null;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Distribución de Profesores
        </Text>

        {gyms.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Text className="text-gray-500">No hay gimnasios registrados</Text>
          </View>
        ) : (
          <>
            {/* Lista de gimnasios */}
            {!selectedGymData && (
              <View>
                {gyms.map((gym) => (
                  <TouchableOpacity
                    key={gym.id}
                    onPress={() => setSelectedGym(gym.id)}
                    className="bg-white rounded-2xl p-5 mb-4 shadow-sm"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xl font-bold text-gray-800 mb-2">
                      {gym.name}
                    </Text>
                    <View className="flex-row gap-4">
                      <View>
                        <Text className="text-gray-600 text-sm">Profesores</Text>
                        <Text className="text-2xl font-bold text-green-600">
                          {gym.professors.length}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-gray-600 text-sm">Alumnos</Text>
                        <Text className="text-2xl font-bold text-blue-600">
                          {gym.students.length}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Detalle del gimnasio seleccionado */}
            {selectedGymData && (
              <View>
                <TouchableOpacity
                  onPress={() => setSelectedGym(null)}
                  className="mb-4"
                >
                  <Text className="text-blue-600 font-semibold">← Volver</Text>
                </TouchableOpacity>

                <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
                  <Text className="text-2xl font-bold text-gray-800 mb-4">
                    {selectedGymData.name}
                  </Text>

                  {/* Profesores */}
                  <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-3">
                      Profesores ({selectedGymData.professors.length})
                    </Text>
                    {selectedGymData.professors.length === 0 ? (
                      <Text className="text-gray-500 text-sm">
                        No hay profesores asignados
                      </Text>
                    ) : (
                      selectedGymData.professors.map((professor) => {
                        const professorStudents = selectedGymData.students.filter(
                          (s) => s.professorId === professor.id
                        );
                        return (
                          <View
                            key={professor.id}
                            className="bg-gray-50 rounded-xl p-4 mb-3"
                          >
                            <Text className="font-semibold text-gray-800 mb-1">
                              {professor.displayName}
                            </Text>
                            <Text className="text-gray-600 text-sm mb-2">
                              {professor.email}
                            </Text>
                            <Text className="text-blue-600 text-sm font-medium">
                              {professorStudents.length} {professorStudents.length === 1 ? 'alumno' : 'alumnos'} asignados
                            </Text>
                          </View>
                        );
                      })
                    )}
                  </View>

                  {/* Alumnos sin profesor */}
                  <View>
                    <Text className="text-lg font-bold text-gray-800 mb-3">
                      Alumnos sin Profesor (
                      {
                        selectedGymData.students.filter((s) => !s.professorId)
                          .length
                      }
                      )
                    </Text>
                    {selectedGymData.students.filter((s) => !s.professorId)
                      .length === 0 ? (
                      <Text className="text-gray-500 text-sm">
                        Todos los alumnos tienen profesor asignado
                      </Text>
                    ) : (
                      selectedGymData.students
                        .filter((s) => !s.professorId)
                        .map((student) => (
                          <View
                            key={student.id}
                            className="bg-yellow-50 rounded-xl p-4 mb-3"
                          >
                            <Text className="font-semibold text-gray-800 mb-1">
                              {student.displayName}
                            </Text>
                            <Text className="text-gray-600 text-sm">
                              {student.email}
                            </Text>
                          </View>
                        ))
                    )}
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
