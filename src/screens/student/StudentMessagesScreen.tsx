// Pantalla de mensajes del alumno con su profesor
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/messageService';
import { userService } from '../../services/userService';
import { Message, PersonUser } from '../../types';

export default function StudentMessagesScreen() {
  const { user } = useAuth();
  const [professor, setProfessor] = useState<PersonUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadProfessor();
  }, []);

  useEffect(() => {
    if (professor) {
      loadMessages();
    }
  }, [professor]);

  const loadProfessor = async () => {
    if (!user || !user.professorId) {
      setLoading(false);
      return;
    }

    try {
      const prof = await userService.getProfessorById(user.professorId);
      setProfessor(prof);
    } catch (error) {
      console.error('Error loading professor:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!user || !professor) return;

    try {
      const conversation = await messageService.getConversation(
        user.id,
        professor.id
      );
      setMessages(conversation);
      // Marcar como leídos
      await messageService.markConversationAsRead(user.id, professor.id);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !professor || !user) return;

    try {
      setSending(true);
      await messageService.sendMessage(user.id, professor.id, messageText);
      setMessageText('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (!professor) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-6xl mb-4">👨‍🏫</Text>
        <Text className="text-xl font-bold text-gray-800 mb-2">
          No tienes profesor asignado
        </Text>
        <Text className="text-gray-500 text-center">
          Tu gimnasio te asignará un profesor pronto
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-gray-50">
        {/* Header del profesor */}
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-800">
            {professor.displayName}
          </Text>
          <Text className="text-gray-500 text-sm">{professor.email}</Text>
        </View>

        {/* Mensajes */}
        <ScrollView className="flex-1 px-4 py-4">
          {messages.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-gray-500">
                No hay mensajes aún. ¡Envía el primero!
              </Text>
            </View>
          ) : (
            messages.map((message) => {
              const isMe = message.fromUserId === user?.id;
              return (
                <View
                  key={message.id}
                  className={`mb-3 ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <View
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isMe
                        ? 'bg-amber-600 rounded-br-sm'
                        : 'bg-white rounded-bl-sm border border-gray-200'
                    }`}
                  >
                    <Text
                      className={`${
                        isMe ? 'text-white' : 'text-gray-800'
                      } text-base`}
                    >
                      {message.message}
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${
                        isMe ? 'text-amber-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input de mensaje */}
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <View className="flex-row items-center gap-2">
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
              multiline
              maxLength={500}
              autoComplete="off"
              textContentType="none"
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
              className="bg-amber-600 rounded-xl px-6 py-3"
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white font-bold">Enviar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
