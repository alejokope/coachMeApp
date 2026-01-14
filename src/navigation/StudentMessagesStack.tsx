// Stack de navegación para Mensajes del Alumno
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentMessagesScreen from '../screens/student/StudentMessagesScreen';
import PageHeader from '../components/PageHeader';

export type StudentMessagesStackParamList = {
  StudentMessagesHome: undefined;
};

const Stack = createNativeStackNavigator<StudentMessagesStackParamList>();

export default function StudentMessagesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        header: () => <PageHeader icon="chatbubbles-outline" />,
      }}
    >
      <Stack.Screen
        name="StudentMessagesHome"
        component={StudentMessagesScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
