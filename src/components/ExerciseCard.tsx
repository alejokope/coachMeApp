// Componente de tarjeta de ejercicio mejorado y profesional
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Exercise } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function ExerciseCard({
  exercise,
  onPress,
  onEdit,
  onDelete,
  showActions = false,
}: ExerciseCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-3xl p-5 mb-4 shadow-sm"
      activeOpacity={0.7}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      <View className="flex-row items-start">
        {/* Avatar/Icono mejorado */}
        <LinearGradient
          colors={exercise.videoUrl ? ['#8B5CF6', '#6366F1'] : ['#3B82F6', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
          style={{
            shadowColor: exercise.videoUrl ? '#8B5CF6' : '#3B82F6',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          {exercise.videoUrl ? (
            <Ionicons name="videocam" size={28} color="white" />
          ) : (
            <Text className="text-white text-2xl font-bold">
              {exercise.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </LinearGradient>

        <View className="flex-1">
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-lg font-bold text-gray-800 flex-1" numberOfLines={1}>
              {exercise.name}
            </Text>
            {exercise.videoUrl && (
              <View className="bg-purple-100 rounded-full px-2 py-1 ml-2">
                <Ionicons name="videocam" size={12} color="#8B5CF6" />
              </View>
            )}
          </View>
          {exercise.description && (
            <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
              {exercise.description}
            </Text>
          )}
          <View className="flex-row flex-wrap">
            {(exercise.muscleGroups || []).slice(0, 4).map((group, index) => (
              <View
                key={index}
                className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-1"
              >
                <Text className="text-blue-700 text-xs font-semibold">
                  {group}
                </Text>
              </View>
            ))}
            {(exercise.muscleGroups || []).length > 4 && (
              <View className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-1">
                <Text className="text-gray-600 text-xs font-semibold">
                  +{(exercise.muscleGroups || []).length - 4}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {showActions && (onEdit || onDelete) && (
        <View className="flex-row justify-end mt-4 pt-4 border-t border-gray-100 gap-2">
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              className="bg-blue-100 rounded-xl px-5 py-2 flex-row items-center"
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
              <Text className="text-blue-700 font-semibold text-sm">Editar</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              className="bg-red-100 rounded-xl px-5 py-2 flex-row items-center"
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <Text className="text-red-700 font-semibold text-sm">Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
