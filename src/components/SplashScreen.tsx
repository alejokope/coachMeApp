// Splash Screen animado con logo COAHME
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../config/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cScaleAnim = useRef(new Animated.Value(0)).current;
  const cRotateAnim = useRef(new Animated.Value(0)).current;

  // Animaciones individuales para cada letra de COAHME
  const letterAnims = useRef(
    ['C', 'O', 'A', 'H', 'M', 'E'].map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  useEffect(() => {
    // Animar cada letra de COAHME secuencialmente
    const letterAnimations = letterAnims.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ])
    );

    // Secuencia completa
    Animated.sequence([
      // Fade in del fondo
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Animar letras de COAHME
      Animated.parallel(letterAnimations),
      // Aparece la "C" grande
      Animated.parallel([
        Animated.spring(cScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(cRotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Mantener visible
      Animated.delay(1000),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const cRotate = cRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  const cOpacity = cScaleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={theme.gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.logoContainer}>
          {/* Texto "COAHME" en arco sutil */}
          <Animated.View style={styles.coahmeContainer}>
            {['C', 'O', 'A', 'H', 'M', 'E'].map((letter, index) => {
              const isMiddle = index >= 2 && index <= 4;
              const translateY = letterAnims[index].translateY.interpolate({
                inputRange: [0, 20],
                outputRange: [isMiddle ? -8 : 0, isMiddle ? -8 : 0],
              });
              
              return (
                <Animated.Text
                  key={index}
                  style={[
                    styles.coahmeLetter,
                    {
                      opacity: letterAnims[index].opacity,
                      transform: [{ translateY }],
                    },
                  ]}
                >
                  {letter}
                </Animated.Text>
              );
            })}
          </Animated.View>

          {/* "C" grande calligráfica */}
          <Animated.View
            style={[
              styles.bigCContainer,
              {
                opacity: cOpacity,
                transform: [
                  { scale: cScaleAnim },
                  { rotate: cRotate },
                ],
              },
            ]}
          >
            <Text style={styles.bigC}>C</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coahmeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  coahmeLetter: {
    fontSize: 28,
    fontWeight: '200',
    color: theme.text.white,
    letterSpacing: 6,
    fontFamily: 'System',
  },
  bigCContainer: {
    marginTop: 16,
  },
  bigC: {
    fontSize: 140,
    fontWeight: '900',
    color: theme.text.white,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
});
