// Componente de carga profesional y moderno
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface LoadingScreenProps {
  message?: string;
  color?: string;
  icon?: string;
}

export default function LoadingScreen({ 
  message = 'Cargando...', 
  color = '#8B5CF6',
  icon 
}: LoadingScreenProps) {
  return (
    <LinearGradient
      colors={[`${color}15`, `${color}05`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 items-center justify-center"
    >
      <View className="items-center">
        {icon && (
          <View className="mb-6">
            <View
              className="rounded-full p-6"
              style={{ backgroundColor: `${color}20` }}
            >
              <Ionicons name={icon as any} size={48} color={color} />
            </View>
          </View>
        )}
        <ActivityIndicator size="large" color={color} />
        <Text className="text-gray-700 mt-4 text-lg font-semibold">
          {message}
        </Text>
        <Text className="text-gray-500 mt-2 text-sm">
          Por favor espera...
        </Text>
      </View>
    </LinearGradient>
  );
}
