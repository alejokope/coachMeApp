// Pantalla de rutinas del profesor (galería) - Mejorada y profesional
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Routine } from '../../types';
import { routineService } from '../../services/routineService';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from '../../components/LoadingScreen';

type ProfessorStackParamList = {
  ProfessorHome: undefined;
  CreateRoutine: undefined;
  AssignRoutine: { routineId: string; routineName: string };
  Comments: undefined;
};

type ProfessorScreenNavigationProp = NativeStackNavigationProp<
  ProfessorStackParamList,
  'ProfessorHome'
>;

export default function ProfessorRoutinesScreen() {
  const navigation = useNavigation<ProfessorScreenNavigationProp>();
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
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
      const data = await routineService.getProfessorRoutines(user?.id || '');
      // Filtrar solo plantillas (galería)
      const templates = data.filter((r) => r.isTemplate);
      setRoutines(templates);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando rutinas..." color="#10B981" icon="library-outline" />;
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header mejorado */}
      <LinearGradient
        colors={['#10B981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-6 pb-8"
      >
        <Text className="text-3xl font-bold text-white mb-2">
          Galería de Rutinas
        </Text>
        <Text className="text-green-100 text-base">
          {routines.length} {routines.length === 1 ? 'plantilla' : 'plantillas'} disponibles
        </Text>
      </LinearGradient>

      <View className="px-6 py-6">
        {/* Botones de acción mejorados */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateRoutine' as any)}
            className="flex-1 bg-white rounded-2xl p-5 shadow-lg flex-row items-center justify-center"
            activeOpacity={0.8}
            style={{
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons name="add-circle" size={24} color="#10B981" style={{ marginRight: 8 }} />
            <Text className="text-green-600 font-bold text-base">Crear Rutina</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Comments' as any)}
            className="bg-white rounded-2xl p-5 shadow-lg flex-row items-center justify-center"
            activeOpacity={0.8}
            style={{
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons name="chatbubbles" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        {routines.length === 0 ? (
          <View className="bg-white rounded-3xl p-12 items-center shadow-sm">
            <LinearGradient
              colors={['#10B981', '#059669']}
              className="rounded-full w-24 h-24 items-center justify-center mb-6"
            >
              <Ionicons name="library-outline" size={48} color="white" />
            </LinearGradient>
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              Galería Vacía
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Crea tu primera rutina personalizada para tenerla en tu galería
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateRoutine' as any)}
              className="bg-green-600 rounded-xl px-8 py-4"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-base">Crear Primera Rutina</Text>
            </TouchableOpacity>
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
                  <View className="flex-row items-center">
                    <View className="bg-green-100 rounded-full px-3 py-1 mr-2">
                      <Text className="text-green-700 text-xs font-semibold">
                        {routine.days.length} {routine.days.length === 1 ? 'día' : 'días'}
                      </Text>
                    </View>
                    <View className="bg-blue-100 rounded-full px-3 py-1">
                      <Text className="text-blue-700 text-xs font-semibold">Plantilla</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={() => navigation.navigate('AssignRoutine' as any, { 
                  routineId: routine.id,
                  routineName: routine.name 
                })}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl py-3 items-center mt-3"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <Ionicons name="person-add" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold text-base">Asignar a Alumno</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
