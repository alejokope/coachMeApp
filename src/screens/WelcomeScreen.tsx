// Pantalla de bienvenida - Diseño profesional y moderno
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';

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
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const handlePress = (userType: 'gym' | 'person') => {
    navigation.navigate('Auth', { userType });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
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
          {/* Logo/Icono */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={theme.gradients.primary}
              style={styles.logoCircle}
            >
              <Ionicons name="barbell" size={48} color={theme.text.white} />
            </LinearGradient>
            <Text style={styles.appName}>CoachMe</Text>
            <Text style={styles.tagline}>Tu entrenador personal</Text>
          </View>

          {/* Opciones */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              onPress={() => handlePress('gym')}
              style={styles.optionCard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.gradients.primary}
                style={styles.optionIconContainer}
              >
                <Ionicons name="business" size={32} color={theme.text.white} />
              </LinearGradient>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Soy un Gimnasio</Text>
                <Text style={styles.optionDescription}>
                  Gestiona usuarios, profesores y rutinas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePress('person')}
              style={styles.optionCard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.gradients.secondary}
                style={styles.optionIconContainer}
              >
                <Ionicons name="person" size={32} color={theme.text.white} />
              </LinearGradient>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Soy una Persona</Text>
                <Text style={styles.optionDescription}>
                  Crea y sigue tus rutinas personales
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.version}>Versión 1.0.0</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl * 2,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    ...theme.typography.h1,
    color: theme.text.white,
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    ...theme.typography.body,
    color: theme.text.whiteAlpha[90],
    fontSize: 18,
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: theme.spacing.lg,
  },
  optionCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...theme.typography.h3,
    color: theme.text.primary,
    marginBottom: theme.spacing.xs,
  },
  optionDescription: {
    ...theme.typography.caption,
    color: theme.text.secondary,
    fontSize: 13,
  },
  version: {
    ...theme.typography.caption,
    color: theme.text.whiteAlpha[60],
    marginTop: theme.spacing.xxxl,
  },
});
