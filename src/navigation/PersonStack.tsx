// Stack de navegación para Persona
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PersonScreen from '../screens/person/PersonScreen';
import CreateRoutineScreen from '../screens/professor/CreateRoutineScreen';
import { theme } from '../config/theme';

export type PersonStackParamList = {
  PersonHome: undefined;
  CreateRoutine: undefined;
};

const Stack = createNativeStackNavigator<PersonStackParamList>();

export default function PersonStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="PersonHome"
        component={PersonScreen}
      />
      <Stack.Screen
        name="CreateRoutine"
        component={CreateRoutineScreen}
        options={{ 
          headerShown: true,
          title: 'Crear Rutina Personal',
          headerStyle: { backgroundColor: theme.primary.dark },
          headerTintColor: theme.text.white,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
    </Stack.Navigator>
  );
}
