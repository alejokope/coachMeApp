// Stack de navegación para Perfil del Alumno
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';
import PersonalMaxScreen from '../screens/student/PersonalMaxScreen';
import PageHeader from '../components/PageHeader';

export type StudentProfileStackParamList = {
  StudentProfileHome: undefined;
  PersonalMax: undefined;
};

const Stack = createNativeStackNavigator<StudentProfileStackParamList>();

export default function StudentProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="StudentProfileHome"
        component={StudentProfileScreen}
      />
      <Stack.Screen
        name="PersonalMax"
        component={PersonalMaxScreen}
        options={{ 
          headerShown: true,
          header: () => <PageHeader title="Máximos Personales" icon="fitness-outline" />,
        }}
      />
    </Stack.Navigator>
  );
}
