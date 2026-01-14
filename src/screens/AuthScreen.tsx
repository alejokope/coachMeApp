// Pantalla de autenticación - Diseño profesional y moderno
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';
import Toast from '../components/Toast';
import Loading from '../components/Loading';

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

  const [isLogin, setIsLogin] = useState(userType === 'gym' ? true : true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'professor' | 'student' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type?: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  };

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
      showToast('Por favor completa todos los campos', 'error');
      return;
    }

    if (!isLogin && !displayName) {
      showToast('Por favor ingresa tu nombre', 'error');
      return;
    }

    if (!isLogin && userType === 'person' && !selectedRole) {
      showToast('Por favor selecciona si eres Profesor o Alumno', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (userType === 'person') {
          await register(email, password, displayName, userType, selectedRole || undefined);
        } else {
          showToast('Los gimnasios no pueden registrarse. Contacta al administrador.', 'error');
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Ocurrió un error. Por favor intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={theme.gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={theme.text.white} />
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={theme.gradients.primary}
                  style={styles.logoCircle}
                >
                  <Ionicons
                    name={userType === 'gym' ? 'business' : 'person'}
                    size={32}
                    color={theme.text.white}
                  />
                </LinearGradient>
              </View>
              <Text style={styles.title}>
                {userType === 'gym'
                  ? 'Iniciar Sesión'
                  : (isLogin ? 'Bienvenido' : 'Crear Cuenta')}
              </Text>
              <Text style={styles.subtitle}>
                {userType === 'gym'
                  ? 'Accede a tu gimnasio'
                  : (isLogin
                    ? 'Inicia sesión en tu cuenta'
                    : 'Crea tu cuenta y comienza')}
              </Text>
            </View>

            {/* Formulario */}
            <View style={styles.formCard}>
              {!isLogin && userType === 'person' && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nombre Completo</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={20} color={theme.text.tertiary} style={styles.inputIcon} />
                      <TextInput
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Ej: Juan Pérez"
                        placeholderTextColor={theme.text.tertiary}
                        style={styles.input}
                        autoCapitalize="words"
                        autoComplete="off"
                        textContentType="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>¿Eres Profesor o Alumno?</Text>
                    <View style={styles.roleContainer}>
                      <TouchableOpacity
                        onPress={() => setSelectedRole('professor')}
                        style={[
                          styles.roleButton,
                          selectedRole === 'professor' && styles.roleButtonActive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="school"
                          size={24}
                          color={selectedRole === 'professor' ? theme.primary.main : theme.text.tertiary}
                        />
                        <Text
                          style={[
                            styles.roleButtonText,
                            selectedRole === 'professor' && styles.roleButtonTextActive,
                          ]}
                        >
                          Profesor
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setSelectedRole('student')}
                        style={[
                          styles.roleButton,
                          selectedRole === 'student' && styles.roleButtonActive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="person"
                          size={24}
                          color={selectedRole === 'student' ? theme.primary.main : theme.text.tertiary}
                        />
                        <Text
                          style={[
                            styles.roleButtonText,
                            selectedRole === 'student' && styles.roleButtonTextActive,
                          ]}
                        >
                          Alumno
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={theme.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@email.com"
                    placeholderTextColor={theme.text.tertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={theme.text.tertiary}
                    secureTextEntry={!showPassword}
                    autoComplete="off"
                    textContentType="none"
                    style={[styles.input, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.text.tertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={styles.submitButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={theme.gradients.primary}
                  style={styles.submitButtonGradient}
                >
                  {loading ? (
                    <Text style={styles.submitButtonText}>Cargando...</Text>
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {userType === 'person' && (
                <TouchableOpacity
                  onPress={() => setIsLogin(!isLogin)}
                  style={styles.switchButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchButtonText}>
                    {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                    <Text style={styles.switchButtonLink}>
                      {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>

      <Loading visible={loading} message={isLogin ? "Iniciando sesión..." : "Creando cuenta..."} fullScreen />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxxl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: theme.spacing.sm,
  },
  logoContainer: {
    marginBottom: theme.spacing.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    ...theme.typography.h1,
    color: theme.text.white,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.text.whiteAlpha[90],
    fontSize: 16,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.body,
    color: theme.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.background.tertiary,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    ...theme.typography.body,
    color: theme.text.primary,
    flex: 1,
    paddingVertical: theme.spacing.md,
  },
  eyeButton: {
    padding: theme.spacing.sm,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: theme.spacing.sm,
  },
  roleButtonActive: {
    backgroundColor: theme.iconBackground.light,
    borderColor: theme.primary.main,
  },
  roleButtonText: {
    ...theme.typography.body,
    color: theme.text.secondary,
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: theme.primary.main,
  },
  submitButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  submitButtonGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    ...theme.typography.h3,
    color: theme.text.white,
  },
  switchButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  switchButtonText: {
    ...theme.typography.body,
    color: theme.text.secondary,
    textAlign: 'center',
  },
  switchButtonLink: {
    color: theme.primary.main,
    fontWeight: '700',
  },
});
