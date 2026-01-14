// Pantalla de autenticación - Diseño moderno con gradiente púrpura
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'professor' | 'student' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type?: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) {
      showToast('Por favor completa todos los campos', 'error');
      return;
    }

    if (!isLogin) {
      if (!displayName) {
        showToast('Por favor ingresa tu nombre completo', 'error');
        return;
      }
      if (!selectedRole) {
        showToast('Por favor selecciona el tipo de usuario', 'error');
        return;
      }
      if (password.length < 8) {
        showToast('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
      }
      if (!acceptTerms) {
        showToast('Debes aceptar los términos y condiciones', 'error');
        return;
      }
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

  const getUserTypeLabel = () => {
    if (userType === 'gym') return 'Gimnasio';
    if (selectedRole === 'professor') return 'Profesor';
    if (selectedRole === 'student') return 'Alumno';
    return 'Persona';
  };

  const getUserTypeIcon = () => {
    if (userType === 'gym') return 'business';
    if (selectedRole === 'professor') return 'school';
    return 'person';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2', '#667eea']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Formas circulares decorativas */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        {/* Botón de volver */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <View style={styles.backButtonContainer}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isLogin ? (
            // VISTA DE LOGIN
            <Animated.View
              style={[
                styles.content,
                { opacity: fadeAnim },
              ]}
            >
              {/* Logo */}
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <Ionicons name="barbell" size={32} color="#667eea" />
                </View>
              </View>

              {/* Mensaje de bienvenida */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>Bienvenido de vuelta</Text>
                <Text style={styles.welcomeSubtitle}>
                  Inicia sesión en tu cuenta de CoachMe
                </Text>
              </View>

              {/* Card de tipo de usuario */}
              <View style={styles.userTypeCard}>
                <View style={styles.userTypeIconContainer}>
                  <Ionicons name={getUserTypeIcon()} size={20} color="#667eea" />
                </View>
                <View style={styles.userTypeTextContainer}>
                  <Text style={styles.userTypeLabel}>Iniciando sesión como</Text>
                  <Text style={styles.userTypeValue}>{getUserTypeLabel()}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.changeButton}
                >
                  <Text style={styles.changeButtonText}>Cambiar</Text>
                </TouchableOpacity>
              </View>

              {/* Formulario */}
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder={userType === 'gym' ? 'gimnasio@ejemplo.com' : 'tu@email.com'}
                      placeholderTextColor="#9CA3AF"
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
                  <Text style={styles.inputLabel}>Contraseña</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
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
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Recordarme y Olvidé contraseña */}
                <View style={styles.optionsRow}>
                  <View style={styles.rememberMeContainer}>
                    <TouchableOpacity
                      onPress={() => setRememberMe(!rememberMe)}
                      style={styles.checkboxContainer}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                      </View>
                      <Text style={styles.rememberMeText}>Recordarme</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity>
                    <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                  </TouchableOpacity>
                </View>

                {/* Botón de submit */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  style={styles.submitButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Cargando...' : 'Iniciar Sesión'}
                  </Text>
                </TouchableOpacity>

                {userType === 'person' && (
                  <TouchableOpacity
                    onPress={() => setIsLogin(false)}
                    style={styles.switchButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.switchButtonText}>
                      ¿No tienes cuenta?{' '}
                      <Text style={styles.switchButtonLink}>Regístrate</Text>
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          ) : (
            // VISTA DE REGISTRO
            <Animated.View
              style={[
                styles.content,
                { opacity: fadeAnim },
              ]}
            >
              {/* Título y Logo en la parte superior */}
              <View style={styles.registerTopSection}>
                <Text style={styles.registerTitle}>Registro</Text>
                <View style={styles.logoIcon}>
                  <Ionicons name="barbell" size={32} color="#667eea" />
                </View>
                <Text style={styles.appName}>CoachMe</Text>
                <Text style={styles.registerSubtitle}>Crea tu cuenta para comenzar</Text>
              </View>

              {/* Card blanca grande con el formulario */}
              <View style={styles.registerCard}>
                <View style={styles.formContainer}>
                  {/* Nombre completo */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.registerInputLabel}>Nombre completo</Text>
                    <View style={styles.registerInputWrapper}>
                      <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Ingresa tu nombre completo"
                        placeholderTextColor="#9CA3AF"
                        style={styles.registerInput}
                        autoCapitalize="words"
                        autoComplete="off"
                        textContentType="none"
                      />
                    </View>
                  </View>

                  {/* Email */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.registerInputLabel}>Correo electrónico</Text>
                    <View style={styles.registerInputWrapper}>
                      <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="ejemplo@correo.com"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="off"
                        textContentType="none"
                        style={styles.registerInput}
                      />
                    </View>
                  </View>

                  {/* Tipo de usuario */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.registerInputLabel}>Tipo de usuario</Text>
                    <View style={styles.roleSelectionContainer}>
                      {/* Profesor */}
                      <TouchableOpacity
                        onPress={() => setSelectedRole('professor')}
                        style={styles.roleCard}
                        activeOpacity={0.8}
                      >
                        <View style={styles.radioButtonContainer}>
                          <View style={[styles.radioButton, selectedRole === 'professor' && styles.radioButtonSelected]}>
                            {selectedRole === 'professor' && <View style={styles.radioButtonInner} />}
                          </View>
                        </View>
                        <View style={[styles.roleIconContainer, { backgroundColor: '#F3E8FF' }]}>
                          <Ionicons name="laptop-outline" size={24} color="#667eea" />
                        </View>
                        <View style={styles.roleTextContainer}>
                          <Text style={styles.roleCardTitle}>Profesor</Text>
                          <Text style={styles.roleCardDescription}>Crea y asigna rutinas</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Alumno */}
                      <TouchableOpacity
                        onPress={() => setSelectedRole('student')}
                        style={styles.roleCard}
                        activeOpacity={0.8}
                      >
                        <View style={styles.radioButtonContainer}>
                          <View style={[styles.radioButton, selectedRole === 'student' && styles.radioButtonSelected]}>
                            {selectedRole === 'student' && <View style={styles.radioButtonInner} />}
                          </View>
                        </View>
                        <View style={[styles.roleIconContainer, { backgroundColor: '#E0F2FE' }]}>
                          <Ionicons name="school-outline" size={24} color="#0EA5E9" />
                        </View>
                        <View style={styles.roleTextContainer}>
                          <Text style={styles.roleCardTitle}>Alumno</Text>
                          <Text style={styles.roleCardDescription}>Entrena y sigue rutinas</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Contraseña */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.registerInputLabel}>Contraseña</Text>
                    <View style={styles.registerInputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Mínimo 8 caracteres"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        autoComplete="off"
                        textContentType="none"
                        style={[styles.registerInput, { flex: 1 }]}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirmar contraseña */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.registerInputLabel}>Confirmar contraseña</Text>
                    <View style={styles.registerInputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Repite tu contraseña"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showConfirmPassword}
                        autoComplete="off"
                        textContentType="none"
                        style={styles.registerInput}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeButton}
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Términos y condiciones */}
                  <View style={styles.termsContainer}>
                    <TouchableOpacity
                      onPress={() => setAcceptTerms(!acceptTerms)}
                      style={styles.checkboxContainer}
                    >
                      <View style={[styles.squareCheckbox, acceptTerms && styles.squareCheckboxChecked]}>
                        {acceptTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                      <Text style={styles.termsText}>
                        Acepto los{' '}
                        <Text style={styles.termsLink}>términos y condiciones</Text>
                        {' '}y la{' '}
                        <Text style={styles.termsLink}>política de privacidad</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Botón crear cuenta */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    style={styles.createAccountButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.createAccountButtonText}>
                      {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </Text>
                  </TouchableOpacity>

                  {/* Link a login */}
                  <TouchableOpacity
                    onPress={() => setIsLogin(true)}
                    style={styles.loginLinkContainer}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.loginLinkText}>
                      ¿Ya tienes cuenta?{' '}
                      <Text style={styles.loginLink}>Inicia sesión</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
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
  // Formas circulares decorativas
  circle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -40,
    left: -40,
  },
  circle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: -30,
    right: -30,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },
  content: {
    width: '100%',
  },
  // ESTILOS DE LOGIN
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  userTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userTypeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userTypeTextContainer: {
    flex: 1,
  },
  userTypeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  userTypeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  changeButton: {
    padding: 4,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  eyeButton: {
    padding: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#667eea',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  switchButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  switchButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  switchButtonLink: {
    color: '#FFFFFF',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  // ESTILOS DE REGISTRO
  registerTopSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  registerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  registerSubtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  registerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  registerInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  registerInputWrapper: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerInput: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  roleSelectionContainer: {
    gap: 12,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  radioButtonContainer: {
    marginRight: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#667eea',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#667eea',
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  roleCardDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  termsContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  squareCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareCheckboxChecked: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  termsText: {
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: '#667eea',
    textDecorationLine: 'underline',
  },
  createAccountButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  createAccountButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginLinkContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#1F2937',
  },
  loginLink: {
    color: '#667eea',
    fontWeight: '600',
  },
});
