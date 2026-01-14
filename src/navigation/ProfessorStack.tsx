// Stack de navegación para Profesor
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfessorScreen from '../screens/professor/ProfessorScreen';
import CreateRoutineScreen from '../screens/professor/CreateRoutineScreen';
import AssignRoutineScreen from '../screens/professor/AssignRoutineScreen';
import CommentsScreen from '../screens/professor/CommentsScreen';
import StudentDetailScreen from '../screens/professor/StudentDetailScreen';
import PageHeader from '../components/PageHeader';

export type ProfessorStackParamList = {
  ProfessorHome: undefined;
  CreateRoutine: undefined;
  RoutineDetail: { routineId: string };
  AssignRoutine: { routineId: string; routineName?: string };
  Comments: undefined;
  StudentDetail: { studentId: string };
};

const Stack = createNativeStackNavigator<ProfessorStackParamList>();

export default function ProfessorStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        header: () => <PageHeader icon="school-outline" />,
      }}
    >
      <Stack.Screen
        name="ProfessorHome"
        component={ProfessorScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateRoutine"
        component={CreateRoutineScreen}
        options={{ 
          header: () => <PageHeader title="Crear Rutina" icon="add-circle-outline" />,
        }}
      />
      <Stack.Screen
        name="AssignRoutine"
        component={AssignRoutineScreen}
        options={{ 
          header: () => <PageHeader title="Asignar Rutina" icon="people-outline" />,
        }}
      />
      <Stack.Screen
        name="Comments"
        component={CommentsScreen}
        options={{ 
          header: () => <PageHeader title="Comentarios" icon="chatbubbles-outline" />,
        }}
      />
      <Stack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{ 
          header: () => <PageHeader title="Detalle del Alumno" icon="person-outline" />,
        }}
      />
    </Stack.Navigator>
  );
}
