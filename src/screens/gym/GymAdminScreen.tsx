// Pantalla de Admin de Gimnasio - Dashboard
import React from 'react';
import { View } from 'react-native';
import GymAdminDashboard from './GymAdminDashboard';

export default function GymAdminScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <GymAdminDashboard />
    </View>
  );
}
