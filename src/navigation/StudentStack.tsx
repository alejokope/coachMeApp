// Stack de navegación para Alumno
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentScreen from '../screens/student/StudentScreen';
import WorkoutScreen from '../screens/student/WorkoutScreen';
import PersonalMaxScreen from '../screens/student/PersonalMaxScreen';
import PageHeader from '../components/PageHeader';
import { theme } from '../config/theme';

export type StudentStackParamList = {
  StudentHome: undefined;
  Workout: { routineId: string };
  PersonalMax: undefined;
};

const Stack = createNativeStackNavigator<StudentStackParamList>();

export default function StudentStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        header: () => <PageHeader icon="fitness-outline" />,
      }}
    >
      <Stack.Screen
        name="StudentHome"
        component={StudentScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{ 
          header: () => <PageHeader title="Entrenamiento" icon="barbell-outline" />,
        }}
      />
      <Stack.Screen
        name="PersonalMax"
        component={PersonalMaxScreen}
        options={{ 
          header: () => <PageHeader title="Máximos Personales" icon="fitness-outline" />,
        }}
      />
    </Stack.Navigator>
  );
}
