// Pantalla de rutinas del alumno - Mejorada y profesional
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { routineService } from '../../services/routineService';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from '../../components/LoadingScreen';

type StudentRoutinesStackParamList = {
  StudentRoutinesHome: undefined;
  Workout: { routineId: string };
};

type StudentNavigationProp = NativeStackNavigationProp<
  StudentRoutinesStackParamList,
  'StudentRoutinesHome'
>;

export default function StudentRoutinesScreen() {
  const navigation = useNavigation<StudentNavigationProp>();
  const { user } = useAuth();
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutines();
    const unsubscribe = navigation.addListener('focus', () => {
      loadRoutines();
    });
    return unsubscribe;
  }, [navigation]);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      const data = await routineService.getStudentRoutines(user?.id || '');
      setRoutines(data);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando rutinas..." color="#F59E0B" icon="fitness-outline" />;
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header mejorado */}
      <LinearGradient
        colors={['#F59E0B', '#D97706', '#B45309']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-6 pb-8"
      >
        <Text className="text-3xl font-bold text-white mb-2">
          Mis Rutinas
        </Text>
        <Text className="text-amber-100 text-base">
          {routines.length} {routines.length === 1 ? 'rutina activa' : 'rutinas activas'}
        </Text>
      </LinearGradient>

      <View className="px-6 py-6">
        {routines.length === 0 ? (
          <View className="bg-white rounded-3xl p-12 items-center shadow-sm">
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              className="rounded-full w-24 h-24 items-center justify-center mb-6"
            >
              <Ionicons name="fitness-outline" size={48} color="white" />
            </LinearGradient>
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              No tienes rutinas asignadas
            </Text>
            <Text className="text-gray-500 text-center">
              Tu profesor te asignará una rutina pronto
            </Text>
          </View>
        ) : (
          routines.map((routine) => (
            <View
              key={routine.id}
              className="bg-white rounded-3xl p-6 mb-4 shadow-lg"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-800 mb-1">
                    {routine.name}
                  </Text>
                  {routine.description && (
                    <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
                      {routine.description}
                    </Text>
                  )}
                  <View className="flex-row items-center flex-wrap">
                    <View className="bg-amber-100 rounded-full px-3 py-1 mr-2 mb-2">
                      <Text className="text-amber-700 text-xs font-semibold">
                        {routine.days.length} {routine.days.length === 1 ? 'día' : 'días'}
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-3 py-1 mb-2 ${
                        routine.status === 'active'
                          ? 'bg-green-100'
                          : routine.status === 'completed'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          routine.status === 'active'
                            ? 'text-green-700'
                            : routine.status === 'completed'
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {routine.status === 'active'
                          ? 'Activa'
                          : routine.status === 'completed'
                          ? 'Completada'
                          : 'Pausada'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={() => navigation.navigate('Workout', { 
                  routineId: routine.id
                })}
                className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl py-4 items-center mt-3"
                activeOpacity={0.8}
                style={{
                  shadowColor: '#F59E0B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="play-circle" size={24} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold text-lg">Iniciar Entrenamiento</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
