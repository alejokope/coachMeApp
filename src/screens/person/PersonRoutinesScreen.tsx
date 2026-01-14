// Pantalla de rutinas personales
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Routine } from '../../types';
import { routineService } from '../../services/routineService';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from '../../components/LoadingScreen';
import { theme } from '../../config/theme';
import PageHeader from '../../components/PageHeader';

type PersonRoutinesStackParamList = {
  PersonRoutinesHome: undefined;
  CreateRoutine: undefined;
};

type PersonRoutinesNavigationProp = NativeStackNavigationProp<
  PersonRoutinesStackParamList,
  'PersonRoutinesHome'
>;

export default function PersonRoutinesScreen() {
  const navigation = useNavigation<PersonRoutinesNavigationProp>();
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutines();
    const unsubscribe = navigation.addListener('focus', () => {
      loadRoutines();
    });
    return unsubscribe;
  }, [navigation]);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const data = await routineService.getProfessorRoutines(user.id);
        const personalRoutines = data.filter((r) => !r.gymId);
        setRoutines(personalRoutines);
      }
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando rutinas..." color={theme.primary.main} icon="fitness-outline" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
      <PageHeader icon="fitness-outline" />
      <ScrollView 
        contentContainerStyle={{ padding: theme.spacing.xl }}
      >
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateRoutine' as any)}
        style={[
          styles.createButton,
          {
            backgroundColor: theme.background.secondary,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing.xl,
            marginBottom: theme.spacing.xl,
            shadowColor: theme.shadow.secondary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 5,
          }
        ]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme.gradients.primary}
          style={{
            borderRadius: theme.borderRadius.xl,
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing.lg,
          }}
        >
          <Ionicons name="add" size={28} color={theme.text.white} />
        </LinearGradient>
        <Text style={{ color: theme.primary.main, fontWeight: '700', fontSize: 18 }}>Crear Nueva Rutina</Text>
      </TouchableOpacity>

      {routines.length === 0 ? (
        <View style={{
          backgroundColor: theme.background.secondary,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.xxxl * 1.5,
          alignItems: 'center',
          shadowColor: theme.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <LinearGradient
            colors={theme.gradients.primary}
            style={{
              borderRadius: theme.borderRadius.xl * 1.2,
              width: 96,
              height: 96,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.xl,
            }}
          >
            <Ionicons name="fitness-outline" size={48} color={theme.text.white} />
          </LinearGradient>
          <Text style={{
            fontSize: 22,
            fontWeight: '700',
            color: theme.text.primary,
            marginBottom: 8,
          }}>
            No tienes rutinas
          </Text>
          <Text style={{
            color: theme.text.secondary,
            textAlign: 'center',
            marginBottom: theme.spacing.xl,
          }}>
            Crea tu primera rutina personal para comenzar
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateRoutine' as any)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={theme.gradients.primary}
              style={{
                borderRadius: theme.borderRadius.lg,
                paddingHorizontal: theme.spacing.xxxl,
                paddingVertical: theme.spacing.lg,
              }}
            >
              <Text style={{ color: theme.text.white, fontWeight: '700', fontSize: 16 }}>Crear Rutina</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        routines.map((routine) => (
          <View
            key={routine.id}
            style={{
              backgroundColor: theme.background.secondary,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.xl,
              marginBottom: theme.spacing.lg,
              shadowColor: theme.shadow.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: theme.text.primary,
                  marginBottom: 4,
                }}>
                  {routine.name}
                </Text>
                {routine.description && (
                  <Text style={{
                    color: theme.text.secondary,
                    fontSize: 14,
                    marginBottom: 12,
                  }} numberOfLines={2}>
                    {routine.description}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    backgroundColor: theme.iconBackground.light,
                    borderRadius: theme.borderRadius.xl,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    marginRight: 8,
                  }}>
                    <Text style={{
                      color: theme.accent.success,
                      fontSize: 11,
                      fontWeight: '700',
                    }}>
                      {routine.days.length} {routine.days.length === 1 ? 'día' : 'días'}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: theme.iconBackground.tertiary,
                    borderRadius: theme.borderRadius.xl,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                  }}>
                    <Text style={{
                      color: theme.primary.main,
                      fontSize: 11,
                      fontWeight: '700',
                    }}>Personal</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
