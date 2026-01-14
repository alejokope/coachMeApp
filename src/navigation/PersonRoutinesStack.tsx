// Stack wrapper para PersonRoutinesScreen con navegación a CreateRoutine
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PersonRoutinesScreen from '../screens/person/PersonRoutinesScreen';
import CreateRoutineScreen from '../screens/professor/CreateRoutineScreen';
import { theme } from '../config/theme';

export type PersonRoutinesStackParamList = {
  PersonRoutinesHome: undefined;
  CreateRoutine: undefined;
};

const Stack = createNativeStackNavigator<PersonRoutinesStackParamList>();

export default function PersonRoutinesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="PersonRoutinesHome"
        component={PersonRoutinesScreen}
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
