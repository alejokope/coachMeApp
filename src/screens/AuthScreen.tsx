// Pantalla de autenticación mejorada (Login/Registro)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

type RootStackParamList = {
  Welcome: undefined;
  Auth: { userType: 'gym' | 'person' };
  Main: undefined;
};

type AuthScreenRouteProp = RouteProp<RootStackParamList, 'Auth'>;
type AuthScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Auth'
>;

export default function AuthScreen() {
  const route = useRoute<AuthScreenRouteProp>();
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const { login, register } = useAuth();
  const { userType } = route.params;

  // Si es gym, solo login. Si es person, puede login o register
  const [isLogin, setIsLogin] = useState(userType === 'gym' ? true : true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'professor' | 'student' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isLogin]);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!isLogin && !displayName) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }

    if (!isLogin && userType === 'person' && !selectedRole) {
      Alert.alert('Error', 'Por favor selecciona si eres Profesor o Alumno');
      return;
    }

    // Animación del botón
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Solo person puede registrar
        if (userType === 'person') {
          await register(email, password, displayName, userType, selectedRole || undefined);
        } else {
          Alert.alert('Error', 'Los gimnasios no pueden registrarse. Contacta al administrador.');
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Ocurrió un error. Por favor intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const gradientColors = userType === 'gym' 
    ? ['#667eea', '#764ba2'] 
    : ['#f093fb', '#f5576c'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 48,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Header */}
            <View className="items-center mb-10">
              <View
                className="bg-white/20 rounded-3xl p-5 mb-6 backdrop-blur"
                style={{ borderRadius: 30 }}
              >
                <Text className="text-5xl">
                  {userType === 'gym' ? '🏋️' : '👤'}
                </Text>
              </View>
              <Text className="text-4xl font-bold text-white mb-2 text-center">
                {userType === 'gym' 
                  ? 'Iniciar Sesión' 
                  : (isLogin ? 'Bienvenido' : 'Crear Cuenta')}
              </Text>
              <Text className="text-white/90 text-lg text-center font-medium">
                {userType === 'gym' 
                  ? 'Accede a tu gimnasio'
                  : (isLogin 
                    ? 'Inicia sesión en tu cuenta'
                    : 'Crea tu cuenta y comienza tu entrenamiento')}
              </Text>
            </View>

            {/* Formulario */}
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
              {!isLogin && userType === 'person' && (
                <>
                  <View className="mb-5">
                    <Text className="text-gray-700 font-semibold mb-2 text-sm">
                      Nombre Completo
                    </Text>
                    <View
                      className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200"
                      style={{ borderRadius: 16 }}
                    >
                      <TextInput
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Ej: Juan Pérez"
                        placeholderTextColor="#9CA3AF"
                        className="text-gray-800 text-base"
                        autoCapitalize="words"
                        autoComplete="off"
                        textContentType="none"
                      />
                    </View>
                  </View>

                  <View className="mb-5">
                    <Text className="text-gray-700 font-semibold mb-3 text-sm">
                      ¿Eres Profesor o Alumno?
                    </Text>
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => setSelectedRole('professor')}
                        className={`flex-1 rounded-2xl py-4 items-center border-2 ${
                          selectedRole === 'professor'
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        activeOpacity={0.8}
                        style={{ borderRadius: 16 }}
                      >
                        <Text className="text-3xl mb-2">👨‍🏫</Text>
                        <Text className={`font-semibold text-sm ${
                          selectedRole === 'professor' ? 'text-blue-700' : 'text-gray-600'
                        }`}>
                          Profesor
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setSelectedRole('student')}
                        className={`flex-1 rounded-2xl py-4 items-center border-2 ${
                          selectedRole === 'student'
                            ? 'bg-green-50 border-green-500'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        activeOpacity={0.8}
                        style={{ borderRadius: 16 }}
                      >
                        <Text className="text-3xl mb-2">👨‍🎓</Text>
                        <Text className={`font-semibold text-sm ${
                          selectedRole === 'student' ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          Alumno
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="text-gray-500 text-xs mt-2 text-center">
                      Podrás unirte a un gimnasio después de registrarte
                    </Text>
                  </View>
                </>
              )}

              <View className="mb-5">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Correo Electrónico
                </Text>
                <View
                  className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200"
                  style={{ borderRadius: 16 }}
                >
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@email.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    className="text-gray-800 text-base"
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Contraseña
                </Text>
                <View
                  className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200 flex-row items-center"
                  style={{ borderRadius: 16 }}
                >
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoComplete="off"
                    textContentType="none"
                    className="flex-1 text-gray-800 text-base"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="ml-2"
                  >
                    <Text className="text-gray-500 text-sm font-medium">
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  className="rounded-2xl py-4 items-center mb-4"
                  style={{
                    backgroundColor: userType === 'gym' ? '#667eea' : '#f5576c',
                    borderRadius: 16,
                    shadowColor: userType === 'gym' ? '#667eea' : '#f5576c',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-lg">
                      {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {userType === 'person' && (
                <TouchableOpacity
                  onPress={() => setIsLogin(!isLogin)}
                  className="items-center py-3"
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-600 text-center">
                    {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                    <Text
                      className="font-bold"
                      style={{
                        color: '#f5576c',
                      }}
                    >
                      {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Footer */}
            <View className="items-center mt-6">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="py-2"
              >
                <Text className="text-white/80 text-sm font-medium">
                  ← Volver
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
