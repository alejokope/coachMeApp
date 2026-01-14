// Header elegante con nueva paleta de colores
import React, { useState, useEffect } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import UserProfile from './UserSelector';
import { theme } from '../config/theme';
import { gymService } from '../services/gymService';

export default function GymHeader() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [gymName, setGymName] = useState<string | null>(null);
  const [loadingGym, setLoadingGym] = useState(false);

  // Cargar nombre del gimnasio usando el gymId del usuario gym
  useEffect(() => {
    const loadGymName = async () => {
      if (!user || user.userType !== 'gym') return;
      
      const gymId = (user as any)?.gymId;
      if (!gymId) {
        setGymName(null);
        return;
      }

      // Evitar múltiples llamadas simultáneas
      if (loadingGym) return;

      try {
        setLoadingGym(true);
        const gym = await gymService.getGymById(gymId);
        if (gym) {
          setGymName(gym.name);
        } else {
          setGymName(null);
        }
      } catch (error) {
        console.error('Error loading gym name:', error);
        setGymName(null);
      } finally {
        setLoadingGym(false);
      }
    };

    loadGymName();
  }, [user?.id, (user as any)?.gymId]);

  const displayTitle = user?.displayName || 'Mi Gimnasio';
  
  // Mostrar nombre del gimnasio si existe, sino mostrar email o "Sin gimnasio"
  let displaySubtitle = '';
  if (loadingGym) {
    displaySubtitle = 'Cargando...';
  } else if (gymName) {
    displaySubtitle = gymName;
  } else if ((user as any)?.gymId) {
    displaySubtitle = 'Sin gimnasio';
  } else {
    displaySubtitle = user?.email || 'Administración';
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary.dark} />
      <LinearGradient
        colors={theme.gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 16,
          paddingHorizontal: 20,
          shadowColor: theme.shadow.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={{
                backgroundColor: theme.text.whiteAlpha[20],
                borderRadius: theme.borderRadius.md,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="business" size={20} color={theme.text.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  ...theme.typography.h2,
                  color: theme.text.white,
                  marginBottom: displaySubtitle ? 2 : 0,
                }}
                numberOfLines={1}
              >
                {displayTitle}
              </Text>
              {displaySubtitle && (
                <Text
                  style={{
                    fontSize: theme.typography.small.fontSize,
                    color: theme.text.whiteAlpha[90],
                    fontWeight: theme.typography.small.fontWeight,
                  }}
                  numberOfLines={1}
                >
                  {displaySubtitle}
                </Text>
              )}
            </View>
          </View>
          <View>
            <UserProfile />
          </View>
        </View>
      </LinearGradient>
    </>
  );
}
