// Pantalla para mostrar información del profesor asignado
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { PersonUser } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import LoadingScreen from '../../components/LoadingScreen';

export default function PersonProfessorScreen() {
  const { user } = useAuth();
  const [professor, setProfessor] = useState<PersonUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfessor();
  }, []);

  const loadProfessor = async () => {
    if (!user || !(user as any).professorId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const professorId = (user as any).professorId;
      const professorData = await userService.getProfessorById(professorId);
      setProfessor(professorData);
    } catch (error) {
      console.error('Error loading professor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfessor();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingScreen message="Cargando información..." color={theme.primary.main} icon="school-outline" />;
  }

  if (!professor || !(user as any).professorId) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background.primary }}
        contentContainerStyle={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing.xl,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary.main} />
        }
      >
        <View style={{
          backgroundColor: theme.background.secondary,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.xxxl * 2,
          alignItems: 'center',
          shadowColor: theme.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <View style={{
            backgroundColor: theme.iconBackground.tertiary,
            borderRadius: theme.borderRadius.xl * 1.2,
            width: 80,
            height: 80,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.xl,
          }}>
            <Ionicons name="school-outline" size={40} color={theme.primary.main} />
          </View>
          <Text style={{
            fontSize: 22,
            fontWeight: '700',
            color: theme.text.primary,
            marginBottom: 8,
            textAlign: 'center',
          }}>
            No tienes profesor asignado
          </Text>
          <Text style={{
            color: theme.text.secondary,
            textAlign: 'center',
            fontSize: 15,
          }}>
            Cuando un gimnasio te asigne un profesor, aparecerá aquí
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background.primary }}
      contentContainerStyle={{ padding: theme.spacing.xl }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary.main} />
      }
    >
      {/* Card del profesor */}
      <View style={{
        backgroundColor: theme.background.secondary,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
        shadowColor: theme.shadow.color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
      }}>
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
          <LinearGradient
            colors={theme.gradients.primary}
            style={{
              borderRadius: theme.borderRadius.xl * 1.5,
              width: 100,
              height: 100,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.lg,
            }}
          >
            <Text style={{
              fontSize: 40,
              fontWeight: '800',
              color: theme.text.white,
            }}>
              {professor.displayName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: theme.text.primary,
            marginBottom: 4,
          }}>
            {professor.displayName}
          </Text>
          <View style={{
            backgroundColor: theme.iconBackground.light,
            borderRadius: theme.borderRadius.xl,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: 6,
            marginTop: theme.spacing.sm,
          }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '700',
              color: theme.accent.success,
            }}>
              Profesor
            </Text>
          </View>
        </View>

        <View style={{
          borderTopWidth: 1,
          borderTopColor: theme.background.tertiary,
          paddingTop: theme.spacing.lg,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing.md,
          }}>
            <View style={{
              backgroundColor: theme.iconBackground.tertiary,
              borderRadius: theme.borderRadius.md,
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.md,
            }}>
              <Ionicons name="mail-outline" size={20} color={theme.primary.main} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 12,
                color: theme.text.tertiary,
                marginBottom: 2,
              }}>
                Email
              </Text>
              <Text style={{
                fontSize: 15,
                color: theme.text.primary,
                fontWeight: '600',
              }}>
                {professor.email}
              </Text>
            </View>
          </View>

          {professor.gymId && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <View style={{
                backgroundColor: theme.iconBackground.light,
                borderRadius: theme.borderRadius.md,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.md,
              }}>
                <Ionicons name="business-outline" size={20} color={theme.accent.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  color: theme.text.tertiary,
                  marginBottom: 2,
                }}>
                  Gimnasio
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: theme.text.primary,
                  fontWeight: '600',
                }}>
                  Asignado al gimnasio
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Información adicional */}
      <View style={{
        backgroundColor: theme.background.secondary,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.xl,
        shadowColor: theme.shadow.color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Ionicons name="information-circle" size={24} color={theme.primary.main} style={{ marginRight: theme.spacing.md }} />
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: theme.text.primary,
              marginBottom: 8,
            }}>
              Sobre tu profesor
            </Text>
            <Text style={{
              fontSize: 14,
              color: theme.text.secondary,
              lineHeight: 20,
            }}>
              Tu profesor puede asignarte rutinas de entrenamiento y seguir tu progreso. 
              Puedes comunicarte con él a través de los mensajes en la aplicación.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
