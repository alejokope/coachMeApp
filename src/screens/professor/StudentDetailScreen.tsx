// Pantalla de detalle de alumno para el profesor
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { routineService } from '../../services/routineService';
import { commentService } from '../../services/commentService';
import { messageService } from '../../services/messageService';
import { PersonUser, WorkoutComment } from '../../types';

type ProfessorStackParamList = {
  ProfessorHome: undefined;
  StudentDetail: { studentId: string };
};

type StudentDetailRouteProp = RouteProp<ProfessorStackParamList, 'StudentDetail'>;
type StudentDetailNavigationProp = NativeStackNavigationProp<
  ProfessorStackParamList,
  'StudentDetail'
>;

export default function StudentDetailScreen() {
  const route = useRoute<StudentDetailRouteProp>();
  const navigation = useNavigation<StudentDetailNavigationProp>();
  const { user } = useAuth();
  const { studentId } = route.params;

  const [student, setStudent] = useState<PersonUser | null>(null);
  const [routines, setRoutines] = useState<any[]>([]);
  const [comments, setComments] = useState<WorkoutComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'routines' | 'comments' | 'messages'>('routines');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentData, routinesData, commentsData] = await Promise.all([
        userService.getStudentById(studentId),
        routineService.getStudentRoutines(studentId),
        commentService.getAllComments(), // Filtrar por estudiante después
      ]);

      setStudent(studentData);
      setRoutines(routinesData);
      // Filtrar comentarios del estudiante
      const studentComments = commentsData.filter((c) => c.userId === studentId);
      setComments(studentComments);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!user || !student) return;

    try {
      await messageService.sendMessage(user.id, student.id, message);
      Alert.alert('Éxito', 'Mensaje enviado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!student) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-500">Alumno no encontrado</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header del alumno */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800 mb-1">
          {student.displayName}
        </Text>
        <Text className="text-gray-600 text-sm">{student.email}</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setActiveTab('routines')}
          className={`flex-1 py-3 items-center ${
            activeTab === 'routines' ? 'border-b-2 border-green-600' : ''
          }`}
        >
          <Text
            className={`font-semibold text-xs ${
              activeTab === 'routines' ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            Rutinas ({routines.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('comments')}
          className={`flex-1 py-3 items-center ${
            activeTab === 'comments' ? 'border-b-2 border-green-600' : ''
          }`}
        >
          <Text
            className={`font-semibold text-xs ${
              activeTab === 'comments' ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            Comentarios ({comments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('messages')}
          className={`flex-1 py-3 items-center ${
            activeTab === 'messages' ? 'border-b-2 border-green-600' : ''
          }`}
        >
          <Text
            className={`font-semibold text-xs ${
              activeTab === 'messages' ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            Mensajes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-6 py-4">
        {activeTab === 'routines' && (
          <View>
            {routines.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center">
                <Text className="text-gray-500">
                  No tiene rutinas asignadas
                </Text>
              </View>
            ) : (
              routines.map((routine) => (
                <View
                  key={routine.id}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <Text className="text-lg font-bold text-gray-800 mb-1">
                    {routine.name}
                  </Text>
                  <Text className="text-gray-600 text-sm mb-2">
                    {routine.days.length} {routine.days.length === 1 ? 'día' : 'días'}
                  </Text>
                  <View className="flex-row items-center">
                    <View
                      className={`px-3 py-1 rounded-full ${
                        routine.status === 'active'
                          ? 'bg-green-100'
                          : routine.status === 'completed'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          routine.status === 'active'
                            ? 'text-green-700'
                            : routine.status === 'completed'
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {routine.status === 'active'
                          ? 'Activa'
                          : routine.status === 'completed'
                          ? 'Completada'
                          : 'Pausada'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'comments' && (
          <View>
            {comments.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center">
                <Text className="text-gray-500">
                  No hay comentarios aún
                </Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View
                  key={comment.id}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <Text className="text-gray-800 mb-2">{comment.comment}</Text>
                  <Text className="text-gray-500 text-xs">
                    {new Date(comment.createdAt).toLocaleString('es-ES')}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'messages' && (
          <View className="bg-white rounded-2xl p-6">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Enviar Mensaje
            </Text>
            <Text className="text-gray-600 text-sm mb-4">
              Puedes comunicarte con {student.displayName} a través de la pestaña de mensajes en su perfil.
            </Text>
            <TouchableOpacity
              onPress={() => {
                Alert.prompt(
                  'Enviar Mensaje',
                  'Escribe tu mensaje:',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Enviar',
                      onPress: (message) => {
                        if (message) {
                          handleSendMessage(message);
                        }
                      },
                    },
                  ],
                  'plain-text'
                );
              }}
              className="bg-green-600 rounded-xl py-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold">Enviar Mensaje</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
