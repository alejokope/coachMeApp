// Navegación de tabs principal según tipo de usuario
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { GymUser } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { requestService } from '../services/requestService';
import { theme } from '../config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import SystemAdminScreen from '../screens/admin/SystemAdminScreen';
import GymAdminScreen from '../screens/gym/GymAdminScreen';
import SearchUsersScreen from '../screens/gym/SearchUsersScreen';
import RequestsScreen from '../screens/gym/RequestsScreen';
import GymAdminDashboard from '../screens/gym/GymAdminDashboard';

// Stacks
import ProfessorStack from './ProfessorStack';
import StudentStack from './StudentStack';
import PersonStack from './PersonStack';
import StudentRoutinesStack from './StudentRoutinesStack';
import StudentRequestsStack from './StudentRequestsStack';
import StudentMessagesStack from './StudentMessagesStack';
import StudentProfileStack from './StudentProfileStack';

// Person Screens
import PersonRoutinesStack from './PersonRoutinesStack';
import PersonProfessorScreen from '../screens/person/PersonProfessorScreen';
import PersonConfigScreen from '../screens/person/PersonConfigScreen';
import PersonRequestsScreen from '../screens/person/PersonRequestsScreen';
import PageHeader from '../components/PageHeader';

export type MainTabsParamList = {
  SystemAdmin: undefined;
  GymDashboard: undefined;
  GymSearch: undefined;
  GymRequests: undefined;
  Professor: undefined;
  Student: undefined;
  StudentRoutines: undefined;
  StudentRequests: undefined;
  StudentMessages: undefined;
  StudentProfile: undefined;
  Person: undefined;
  PersonRoutines: undefined;
  PersonProfessor: undefined;
  PersonConfig: undefined;
  PersonRequests: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

import UserProfile from '../components/UserSelector';
import GymHeader from '../components/GymHeader';

export default function MainTabs() {
  const { user, isSystemAdmin, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const [studentPendingRequestsCount, setStudentPendingRequestsCount] = useState(0);
  const [gymPendingRequestsCount, setGymPendingRequestsCount] = useState(0);
  const [personPendingRequestsCount, setPersonPendingRequestsCount] = useState(0);

  // Log removido para mejorar rendimiento

  // Definir funciones antes de usarlas en useEffect
  const loadStudentPendingRequests = async () => {
    if (!user) return;
    try {
      const pendingRequests = await requestService.getUserRequests(user.id, 'pending');
      setStudentPendingRequestsCount(pendingRequests.length);
    } catch (error) {
      console.error('Error loading student pending requests:', error);
    }
  };

  const loadPersonPendingRequests = async () => {
    if (!user || user.userType !== 'person') return;
    try {
      const pendingRequests = await requestService.getUserRequests(user.id, 'pending');
      setPersonPendingRequestsCount(pendingRequests.length);
    } catch (error) {
      console.error('Error loading person pending requests:', error);
    }
  };

  const loadGymPendingRequests = async () => {
    if (!user || user.userType !== 'gym') return;
    try {
      const gymId = (user as any)?.gymId;
      if (!gymId) return;
      
      const pendingRequests = await requestService.getGymRequests(gymId, 'pending');
      setGymPendingRequestsCount(pendingRequests.length);
    } catch (error) {
      console.error('Error loading gym pending requests:', error);
    }
  };

  // Cargar solicitudes pendientes para alumnos
  useEffect(() => {
    if (!user) return;
    
    if (user.userType === 'person' && (user as any).role === 'student' && (user as any).gymId) {
      loadStudentPendingRequests();
    } else if (user.userType === 'person' && (!(user as any).gymId || (user as any).role !== 'student')) {
      loadPersonPendingRequests();
    }
  }, [user]);

  // Cargar solicitudes pendientes para gym
  useEffect(() => {
    if (!user) return;
    
    if (user.userType === 'gym') {
      loadGymPendingRequests();
    }
  }, [user]);

  // Mostrar loading mientras se carga el usuario
  if (loading || !user) {
    return null;
  }

  // Usuario de Gym (solo admin) - tiene prioridad sobre isSystemAdmin
  if (user.userType === 'gym') {
    const gymUser = user as GymUser;
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          header: () => <GymHeader />,
          tabBarActiveTintColor: '#4D7C8A',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: -4,
            marginBottom: 4,
          },
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
            height: 70 + Math.max(insets.bottom - 8, 0),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 12,
            overflow: 'visible',
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      >
        <Tab.Screen
          name="GymDashboard"
          component={GymAdminScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'grid' : 'grid-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tab.Screen
          name="GymSearch"
          component={SearchUsersScreen}
          options={{
            tabBarLabel: 'Buscar',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'search' : 'search-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tab.Screen
          name="GymRequests"
          component={RequestsScreen}
          options={{
            tabBarLabel: 'Solicitudes',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'document-text' : 'document-text-outline'} 
                size={size} 
                color={color} 
              />
            ),
            tabBarBadge: gymPendingRequestsCount > 0 ? (gymPendingRequestsCount > 99 ? '99+' : gymPendingRequestsCount) : undefined,
            tabBarBadgeStyle: {
              backgroundColor: '#EF4444',
              fontSize: 10,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
            },
          }}
          listeners={{
            tabPress: () => {
              loadGymPendingRequests();
            },
          }}
        />
      </Tab.Navigator>
    );
  }

  // Admin del sistema (solo si NO es userType gym - ya filtrado arriba)
  if (isSystemAdmin) {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#9CA3AF',
          headerRight: () => <UserProfile />,
        }}
      >
        <Tab.Screen
          name="SystemAdmin"
          component={SystemAdminScreen}
          options={{
            title: 'Backoffice',
            tabBarLabel: 'Backoffice',
          }}
        />
      </Tab.Navigator>
    );
  }

  // Usuario Persona - puede ser profesor o alumno
  if (user.userType === 'person') {
    const personUser = user as any;
    
    // Si tiene gymId y es profesor
    if (personUser.gymId && personUser.role === 'professor') {
      return (
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#10B981',
            tabBarInactiveTintColor: '#9CA3AF',
          }}
        >
          <Tab.Screen
            name="Professor"
            component={ProfessorStack}
            options={{
              tabBarLabel: 'Profesor',
            }}
          />
        </Tab.Navigator>
      );
    }

    // Si tiene gymId y es alumno
    if (personUser.gymId && personUser.role === 'student') {
      return (
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.primary.main,
            tabBarInactiveTintColor: theme.text.tertiary,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginTop: -4,
              marginBottom: 4,
            },
            tabBarStyle: {
              backgroundColor: theme.background.secondary,
              borderTopWidth: 0,
              paddingBottom: Math.max(insets.bottom, 8),
              paddingTop: 8,
              height: 70 + Math.max(insets.bottom - 8, 0),
              shadowColor: theme.shadow.color,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 12,
              overflow: 'visible',
            },
            tabBarIconStyle: {
              marginTop: 4,
            },
          }}
        >
          <Tab.Screen
            name="StudentRoutines"
            component={StudentRoutinesStack}
            options={{
              tabBarLabel: 'Rutinas',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons 
                  name={focused ? 'fitness' : 'fitness-outline'} 
                  size={size} 
                  color={color} 
                />
              ),
            }}
          />
          <Tab.Screen
            name="StudentRequests"
            options={{
              tabBarLabel: 'Solicitudes',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons 
                  name={focused ? 'document-text' : 'document-text-outline'} 
                  size={size} 
                  color={color} 
                />
              ),
              tabBarBadge: studentPendingRequestsCount > 0 ? (studentPendingRequestsCount > 99 ? '99+' : studentPendingRequestsCount) : undefined,
              tabBarBadgeStyle: {
                backgroundColor: '#EF4444',
                fontSize: 10,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
              },
            }}
            listeners={{
              tabPress: () => {
                loadStudentPendingRequests();
              },
            }}
          >
            {() => <StudentRequestsStack onRequestUpdate={loadStudentPendingRequests} />}
          </Tab.Screen>
          <Tab.Screen
            name="StudentMessages"
            component={StudentMessagesStack}
            options={{
              tabBarLabel: 'Mensajes',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons 
                  name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
                  size={size} 
                  color={color} 
                />
              ),
            }}
          />
          <Tab.Screen
            name="StudentProfile"
            component={StudentProfileStack}
            options={{
              tabBarLabel: 'Perfil',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons 
                  name={focused ? 'person' : 'person-outline'} 
                  size={size} 
                  color={color} 
                />
              ),
            }}
          />
        </Tab.Navigator>
      );
    }

    // Persona sin gym (rutinas personales)
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary.main,
          tabBarInactiveTintColor: theme.text.tertiary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: -4,
            marginBottom: 4,
          },
          tabBarStyle: {
            backgroundColor: theme.background.secondary,
            borderTopWidth: 0,
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
            shadowColor: theme.shadow.color,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 12,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      >
        <Tab.Screen
          name="PersonRoutines"
          component={PersonRoutinesStack}
          options={{
            tabBarLabel: 'Rutinas',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'fitness' : 'fitness-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tab.Screen
          name="PersonProfessor"
          component={PersonProfessorScreen}
          options={{
            tabBarLabel: 'Profesor',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'school' : 'school-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tab.Screen
          name="PersonConfig"
          component={PersonConfigScreen}
          options={{
            tabBarLabel: 'Configuración',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'settings' : 'settings-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tab.Screen
          name="PersonRequests"
          component={PersonRequestsScreen}
          options={{
            tabBarLabel: 'Solicitudes',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'document-text' : 'document-text-outline'} 
                size={size} 
                color={color} 
              />
            ),
            tabBarBadge: personPendingRequestsCount > 0 ? (personPendingRequestsCount > 99 ? '99+' : personPendingRequestsCount) : undefined,
            tabBarBadgeStyle: {
              backgroundColor: '#EF4444',
              fontSize: 10,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
            },
          }}
          listeners={{
            tabPress: () => {
              loadPersonPendingRequests();
            },
          }}
        />
      </Tab.Navigator>
    );
  }

  return null;
}

