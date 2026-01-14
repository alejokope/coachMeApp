// Pantalla de perfil del alumno (ver profesor)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { PersonUser } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageHeader from '../../components/PageHeader';
import { theme } from '../../config/theme';

type StudentStackParamList = {
  StudentHome: undefined;
  PersonalMax: undefined;
};

type StudentNavigationProp = NativeStackNavigationProp<
  StudentStackParamList,
  'StudentHome'
>;

export default function StudentProfileScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<StudentNavigationProp>();
  const [professor, setProfessor] = useState<PersonUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfessor();
  }, []);

  const loadProfessor = async () => {
    if (!user || !user.professorId) {
      setLoading(false);
      return;
    }

    try {
      const prof = await userService.getProfessorById(user.professorId);
      setProfessor(prof);
    } catch (error) {
      console.error('Error loading professor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
        <PageHeader icon="person-outline" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary.main} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
      <PageHeader icon="person-outline" />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl }}>
        {/* Información del profesor */}
        {professor ? (
          <View style={{
            backgroundColor: theme.background.secondary,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing.xl,
            marginBottom: theme.spacing.lg,
            shadowColor: theme.shadow.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: theme.text.primary,
              marginBottom: theme.spacing.lg,
            }}>
              Mi Profesor
            </Text>
            <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <View style={{
                backgroundColor: theme.iconBackground.tertiary,
                borderRadius: theme.borderRadius.xl * 1.2,
                width: 80,
                height: 80,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.md,
              }}>
                <Text style={{ fontSize: 40 }}>👨‍🏫</Text>
              </View>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: theme.text.primary,
              }}>
                {professor.displayName}
              </Text>
              <Text style={{
                color: theme.text.secondary,
                fontSize: 14,
              }}>{professor.email}</Text>
            </View>
          </View>
        ) : (
          <View style={{
            backgroundColor: theme.background.secondary,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing.xxxl * 2,
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
            shadowColor: theme.shadow.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 48, marginBottom: theme.spacing.lg }}>👨‍🏫</Text>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: theme.text.primary,
              marginBottom: theme.spacing.sm,
            }}>
              No tienes profesor asignado
            </Text>
            <Text style={{
              color: theme.text.secondary,
              textAlign: 'center',
            }}>
              Tu gimnasio te asignará un profesor pronto
            </Text>
          </View>
        )}

        {/* Máximos personales */}
        <TouchableOpacity
          onPress={() => navigation.navigate('PersonalMax')}
          style={{
            backgroundColor: theme.background.secondary,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing.xl,
            shadowColor: theme.shadow.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                backgroundColor: theme.iconBackground.quaternary,
                borderRadius: theme.borderRadius.xl * 1.2,
                width: 48,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.lg,
              }}>
                <Text style={{ fontSize: 24 }}>💪</Text>
              </View>
              <View>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: theme.text.primary,
                }}>
                  Mis Máximos Personales
                </Text>
                <Text style={{
                  color: theme.text.secondary,
                  fontSize: 14,
                }}>
                  Gestiona tus récords
                </Text>
              </View>
            </View>
            <Text style={{ color: theme.text.tertiary, fontSize: 20 }}>›</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
