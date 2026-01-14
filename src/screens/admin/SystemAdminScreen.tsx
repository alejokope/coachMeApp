// Pantalla de Backoffice para Admin del Sistema
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import ExerciseManagementScreen from './ExerciseManagementScreen';
import GymManagementScreen from './GymManagementScreen';
import ProfessorsDistributionScreen from './ProfessorsDistributionScreen';
import PageHeader from '../../components/PageHeader';
import { theme } from '../../config/theme';

export default function SystemAdminScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'gyms' | 'exercises' | 'professors'>('gyms');

  return (
    <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
      <PageHeader 
        icon="settings-outline"
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('gyms')}
          style={[
            styles.tab,
            activeTab === 'gyms' && styles.activeTab
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'gyms' && styles.activeTabText
            ]}
          >
            Gimnasios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('exercises')}
          style={[
            styles.tab,
            activeTab === 'exercises' && styles.activeTab
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'exercises' && styles.activeTabText
            ]}
          >
            Ejercicios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('professors')}
          style={[
            styles.tab,
            activeTab === 'professors' && styles.activeTab
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'professors' && styles.activeTabText
            ]}
          >
            Profesores
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.spacing.xl }}>
        {activeTab === 'gyms' && (
          <GymManagementScreen />
        )}

        {activeTab === 'exercises' && (
          <ExerciseManagementScreen />
        )}

        {activeTab === 'professors' && <ProfessorsDistributionScreen />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.background.tertiary,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.primary.main,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  activeTabText: {
    color: theme.primary.main,
  },
});
