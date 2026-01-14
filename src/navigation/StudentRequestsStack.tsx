// Stack de navegación para Solicitudes del Alumno
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentRequestsScreen from '../screens/student/StudentRequestsScreen';
import PageHeader from '../components/PageHeader';

export type StudentRequestsStackParamList = {
  StudentRequestsHome: undefined;
};

const Stack = createNativeStackNavigator<StudentRequestsStackParamList>();

// Componente wrapper que expone función de actualización
function StudentRequestsScreenWrapper({ onRequestUpdate }: { onRequestUpdate?: () => void }) {
  return <StudentRequestsScreen onRequestUpdate={onRequestUpdate} />;
}

export default function StudentRequestsStack({ onRequestUpdate }: { onRequestUpdate?: () => void }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        header: () => <PageHeader icon="document-text-outline" />,
      }}
    >
      <Stack.Screen
        name="StudentRequestsHome"
        options={{ headerShown: false }}
      >
        {() => <StudentRequestsScreenWrapper onRequestUpdate={onRequestUpdate} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
