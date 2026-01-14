// Pantalla para ejecutar el seed de ejercicios
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { seedExercises } from '../../utils/seedExercises';

export default function SeedExercisesScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ addedCount: number; skippedCount: number } | null>(null);

  const handleSeed = async () => {
    Alert.alert(
      'Agregar Ejercicios',
      '¿Estás seguro de que quieres agregar los ejercicios iniciales a la base de datos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Agregar',
          onPress: async () => {
            setLoading(true);
            setResult(null);
            try {
              const result = await seedExercises();
              setResult(result);
              Alert.alert(
                'Éxito',
                `Se agregaron ${result.addedCount} ejercicios exitosamente.`
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudieron agregar los ejercicios');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Agregar Ejercicios Iniciales
          </Text>
          <Text className="text-gray-600 mb-4">
            Este proceso agregará {50}+ ejercicios comunes de gimnasio a la base de datos.
            Estos ejercicios serán globales y estarán disponibles para todos los gimnasios.
          </Text>

          <TouchableOpacity
            onPress={handleSeed}
            disabled={loading}
            className="bg-blue-600 rounded-xl py-4 items-center mb-4"
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Agregar Ejercicios
              </Text>
            )}
          </TouchableOpacity>

          {result && (
            <View className="bg-green-50 rounded-xl p-4 border border-green-200">
              <Text className="text-green-800 font-semibold mb-2">
                Resultado:
              </Text>
              <Text className="text-green-700">
                ✓ Agregados: {result.addedCount}
              </Text>
              {result.skippedCount > 0 && (
                <Text className="text-yellow-700">
                  ⚠ Omitidos: {result.skippedCount}
                </Text>
              )}
            </View>
          )}
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Ejercicios que se agregarán:
          </Text>
          <View className="space-y-2">
            <Text className="text-gray-700 mb-2">
              • Pectorales: Press de banca, aperturas, flexiones, etc.
            </Text>
            <Text className="text-gray-700 mb-2">
              • Espalda: Dominadas, remo, jalones, peso muerto, etc.
            </Text>
            <Text className="text-gray-700 mb-2">
              • Hombros: Press militar, elevaciones laterales, etc.
            </Text>
            <Text className="text-gray-700 mb-2">
              • Bíceps: Curls con barra, mancuernas, martillo, etc.
            </Text>
            <Text className="text-gray-700 mb-2">
              • Tríceps: Press francés, extensiones, fondos, etc.
            </Text>
            <Text className="text-gray-700 mb-2">
              • Piernas: Sentadillas, prensa, extensiones, etc.
            </Text>
            <Text className="text-gray-700 mb-2">
              • Glúteos: Hip thrust, puente, patadas, etc.
            </Text>
            <Text className="text-gray-700 mb-2">
              • Core: Plancha, crunches, mountain climbers, etc.
            </Text>
            <Text className="text-gray-700">
              • Cardio: Burpees, jumping jacks, high knees, etc.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
