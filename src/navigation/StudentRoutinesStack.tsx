// Stack de navegación para Rutinas del Alumno
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentRoutinesScreen from '../screens/student/StudentRoutinesScreen';
import WorkoutScreen from '../screens/student/WorkoutScreen';
import PageHeader from '../components/PageHeader';

export type StudentRoutinesStackParamList = {
  StudentRoutinesHome: undefined;
  Workout: { routineId: string };
};

const Stack = createNativeStackNavigator<StudentRoutinesStackParamList>();

export default function StudentRoutinesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        header: () => <PageHeader icon="fitness-outline" />,
      }}
    >
      <Stack.Screen
        name="StudentRoutinesHome"
        component={StudentRoutinesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{ 
          header: () => <PageHeader title="Entrenamiento" icon="barbell-outline" />,
        }}
      />
    </Stack.Navigator>
  );
}
