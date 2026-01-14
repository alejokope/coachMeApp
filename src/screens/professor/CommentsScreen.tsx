// Pantalla para ver comentarios de entrenamientos mejorada y profesional
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { WorkoutComment } from '../../types';
import { exerciseService } from '../../services/exerciseService';
import { commentService } from '../../services/commentService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function CommentsScreen() {
  const { user } = useAuth();
  const [comments, setComments] = useState<(WorkoutComment & { exerciseName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await commentService.getAllComments();
      
      // Obtener nombres de ejercicios desde la base de datos
      const gymId = (user as any)?.gymId;
      const exercises = await exerciseService.getAllExercises(gymId);
      const commentsWithNames = commentsData.map((comment: WorkoutComment) => {
        const exercise = exercises.find((e) => e.id === comment.exerciseId);
        return {
          ...comment,
          exerciseName: exercise?.name || 'Ejercicio',
        };
      });
      
      setComments(commentsWithNames);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComments();
    setRefreshing(false);
  };

  if (loading && comments.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-gray-600 mt-4 text-lg font-medium">
          Cargando comentarios...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header mejorado con gradiente */}
      <LinearGradient
        colors={['#8B5CF6', '#6366F1', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-12 pb-6"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-3xl font-bold text-white mb-1">
              Comentarios
            </Text>
            <Text className="text-purple-100 text-sm">
              {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'} recibidos
            </Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            className="bg-white/20 rounded-full p-3"
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-purple-100 text-sm">
          Comentarios realizados por los alumnos durante sus entrenamientos
        </Text>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-6 py-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
      >
        {comments.length === 0 ? (
          <View className="bg-white rounded-3xl p-12 items-center shadow-sm mt-4">
            <View className="bg-purple-100 rounded-full w-24 h-24 items-center justify-center mb-6">
              <Ionicons name="chatbubbles-outline" size={48} color="#8B5CF6" />
            </View>
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              No hay comentarios
            </Text>
            <Text className="text-gray-500 text-center">
              Los comentarios de los alumnos aparecerán aquí cuando realicen entrenamientos
            </Text>
          </View>
        ) : (
          comments.map((comment) => (
            <View
              key={comment.id}
              className="bg-white rounded-3xl p-5 mb-4 shadow-sm"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <View className="flex-row items-start mb-3">
                <LinearGradient
                  colors={['#8B5CF6', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                >
                  <Ionicons name="chatbubble" size={20} color="white" />
                </LinearGradient>
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-lg font-bold text-gray-800 mr-2">
                      {comment.exerciseName}
                    </Text>
                    <View className="bg-purple-100 rounded-full px-2 py-1">
                      <Text className="text-purple-700 text-xs font-semibold">
                        Ejercicio
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-700 text-base mb-3 leading-5">
                    {comment.comment}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs ml-1">
                      {comment.createdAt.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })} a las {comment.createdAt.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
