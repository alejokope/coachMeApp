// Pantalla de bienvenida mejorada - Selección de tipo de usuario
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  Welcome: undefined;
  Auth: { userType: 'gym' | 'person' };
};

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Welcome'
>;

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const gymScale = useRef(new Animated.Value(1)).current;
  const personScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = (userType: 'gym' | 'person', scale: Animated.Value) => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Auth', { userType });
    });
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="items-center mb-12"
          >
            <View className="bg-white/20 rounded-3xl p-6 mb-6" style={{ borderRadius: 30 }}>
              <Text className="text-6xl">💪</Text>
            </View>
            <Text className="text-5xl font-bold text-white mb-3 text-center">
              CoachMe
            </Text>
            <Text className="text-xl text-white/90 text-center font-medium">
              Tu entrenador personal en el bolsillo
            </Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="w-full"
          >
            <Text className="text-white/80 text-lg mb-8 text-center font-semibold">
              ¿Cómo quieres usar la app?
            </Text>

            <Animated.View style={{ transform: [{ scale: gymScale }] }}>
              <TouchableOpacity
                onPress={() => handlePress('gym', gymScale)}
                activeOpacity={0.9}
                className="mb-6"
              >
                <View className="absolute top-2 right-2 bg-blue-600 rounded-full px-2 py-1">
                  <Text className="text-white text-xs font-semibold">Solo Login</Text>
                </View>
                <View
                  className="bg-white rounded-3xl p-6 shadow-2xl"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 10,
                  }}
                >
                  <View className="flex-row items-center mb-4">
                    <View className="bg-blue-100 rounded-2xl p-4 mr-4">
                      <Text className="text-4xl">🏋️</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-gray-800 mb-1">
                        Soy un Gimnasio
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        Gestiona usuarios, profesores y rutinas
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <View className="flex-1 h-1 bg-gray-200 rounded-full mr-2">
                      <View className="h-full bg-blue-600 rounded-full" style={{ width: '60%' }} />
                    </View>
                    <Text className="text-blue-600 font-semibold text-sm">Gym</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: personScale }] }}>
              <TouchableOpacity
                onPress={() => handlePress('person', personScale)}
                activeOpacity={0.9}
              >
                <View
                  className="bg-white rounded-3xl p-6 shadow-2xl"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 10,
                  }}
                >
                  <View className="flex-row items-center mb-4">
                    <View className="bg-pink-100 rounded-2xl p-4 mr-4">
                      <Text className="text-4xl">👤</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-gray-800 mb-1">
                        Soy una Persona
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        Crea y sigue tus rutinas personales
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <View className="flex-1 h-1 bg-gray-200 rounded-full mr-2">
                      <View className="h-full bg-pink-600 rounded-full" style={{ width: '60%' }} />
                    </View>
                    <Text className="text-pink-600 font-semibold text-sm">Personal</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          <Animated.View
            style={{ opacity: fadeAnim }}
            className="mt-8"
          >
            <Text className="text-white/60 text-xs text-center">
              Versión 1.0.0
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}
