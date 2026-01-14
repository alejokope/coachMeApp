// Pantalla de perfil del alumno (ver profesor)
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

type StudentStackParamList = {
  StudentHome: undefined;
  PersonalMax: undefined;
};

type StudentNavigationProp = NativeStackNavigationProp<
  StudentStackParamList,
  'StudentHome'
>;

export default function StudentProfileScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<StudentNavigationProp>();
  const [professor, setProfessor] = useState<PersonUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfessor();
  }, []);

  const loadProfessor = async () => {
    if (!user || !user.professorId) {
      setLoading(false);
      return;
    }

    try {
      const prof = await userService.getProfessorById(user.professorId);
      setProfessor(prof);
    } catch (error) {
      console.error('Error loading professor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-6 py-4">
      {/* Información del profesor */}
      {professor ? (
        <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Mi Profesor
          </Text>
          <View className="items-center mb-4">
            <View className="bg-amber-100 rounded-full w-20 h-20 items-center justify-center mb-3">
              <Text className="text-4xl">👨‍🏫</Text>
            </View>
            <Text className="text-lg font-bold text-gray-800">
              {professor.displayName}
            </Text>
            <Text className="text-gray-500 text-sm">{professor.email}</Text>
          </View>
        </View>
      ) : (
        <View className="bg-white rounded-2xl p-8 items-center mb-4">
          <Text className="text-6xl mb-4">👨‍🏫</Text>
          <Text className="text-xl font-bold text-gray-800 mb-2">
            No tienes profesor asignado
          </Text>
          <Text className="text-gray-500 text-center">
            Tu gimnasio te asignará un profesor pronto
          </Text>
        </View>
      )}

      {/* Máximos personales */}
      <TouchableOpacity
        onPress={() => navigation.navigate('PersonalMax')}
        className="bg-white rounded-2xl p-6 shadow-sm"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="bg-blue-100 rounded-full w-12 h-12 items-center justify-center mr-4">
              <Text className="text-2xl">💪</Text>
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-800">
                Mis Máximos Personales
              </Text>
              <Text className="text-gray-500 text-sm">
                Gestiona tus récords
              </Text>
            </View>
          </View>
          <Text className="text-gray-400 text-xl">›</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}
