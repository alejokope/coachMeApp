// Pantalla principal del Profesor con tabs
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ProfessorRoutinesScreen from './ProfessorRoutinesScreen';
import ProfessorStudentsScreen from './ProfessorStudentsScreen';
import ProfessorRequestsScreen from './ProfessorRequestsScreen';
import SearchStudentsScreen from './SearchStudentsScreen';
import PageHeader from '../../components/PageHeader';
import { theme } from '../../config/theme';

export default function ProfessorScreen() {
  const [activeTab, setActiveTab] = useState<'routines' | 'students' | 'requests' | 'search'>('routines');

  return (
    <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
      <PageHeader 
        icon="school-outline"
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('routines')}
          style={[
            styles.tab,
            activeTab === 'routines' && styles.activeTab
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'routines' && styles.activeTabText
            ]}
          >
            Rutinas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('students')}
          style={[
            styles.tab,
            activeTab === 'students' && styles.activeTab
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'students' && styles.activeTabText
            ]}
          >
            Alumnos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('search')}
          style={[
            styles.tab,
            activeTab === 'search' && styles.activeTab
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'search' && styles.activeTabText
            ]}
          >
            Buscar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('requests')}
          style={[
            styles.tab,
            activeTab === 'requests' && styles.activeTab
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'requests' && styles.activeTabText
            ]}
          >
            Solicitudes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'routines' && <ProfessorRoutinesScreen />}
      {activeTab === 'students' && <ProfessorStudentsScreen />}
      {activeTab === 'search' && <SearchStudentsScreen />}
      {activeTab === 'requests' && <ProfessorRequestsScreen />}
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
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.primary.main,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  activeTabText: {
    color: theme.primary.main,
  },
});
