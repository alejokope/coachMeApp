// Stack de navegación para Rutinas del Alumno
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentRoutinesScreen from '../screens/student/StudentRoutinesScreen';
import WorkoutScreen from '../screens/student/WorkoutScreen';
import CreateRoutineScreen from '../screens/professor/CreateRoutineScreen';
import PageHeader from '../components/PageHeader';

export type StudentRoutinesStackParamList = {
  StudentRoutinesHome: undefined;
  Workout: { routineId: string; isPersonal?: boolean };
  CreateRoutine: undefined;
};

const Stack = createNativeStackNavigator<StudentRoutinesStackParamList>();

export default function StudentRoutinesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="StudentRoutinesHome"
        component={StudentRoutinesScreen}
      />
      <Stack.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateRoutine"
        component={CreateRoutineScreen}
        options={{ 
          headerShown: true,
          header: () => <PageHeader title="Crear Rutina" icon="add-circle-outline" />,
        }}
      />
    </Stack.Navigator>
  );
}
