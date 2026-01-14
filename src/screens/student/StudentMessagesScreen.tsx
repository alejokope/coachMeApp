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
import PageHeader from '../../components/PageHeader';
import { theme } from '../../config/theme';

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
      <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
        <PageHeader icon="chatbubbles-outline" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary.main} />
        </View>
      </View>
    );
  }

  if (!professor) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
        <PageHeader icon="chatbubbles-outline" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl }}>
          <Text style={{ fontSize: 48, marginBottom: theme.spacing.lg }}>👨‍🏫</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text.primary, marginBottom: theme.spacing.sm }}>
            No tienes profesor asignado
          </Text>
          <Text style={{ color: theme.text.secondary, textAlign: 'center' }}>
            Tu gimnasio te asignará un profesor pronto
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
      <PageHeader icon="chatbubbles-outline" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {/* Mensajes */}
          <ScrollView contentContainerStyle={{ padding: theme.spacing.xl }}>
            {messages.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxxl }}>
                <Text style={{ color: theme.text.secondary }}>
                  No hay mensajes aún. ¡Envía el primero!
                </Text>
              </View>
            ) : (
              messages.map((message) => {
                const isMe = message.fromUserId === user?.id;
                return (
                  <View
                    key={message.id}
                    style={{
                      marginBottom: theme.spacing.md,
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <View
                      style={{
                        maxWidth: '80%',
                        borderRadius: theme.borderRadius.xl,
                        paddingHorizontal: theme.spacing.lg,
                        paddingVertical: theme.spacing.md,
                        backgroundColor: isMe ? theme.primary.main : theme.background.secondary,
                        borderWidth: isMe ? 0 : 1,
                        borderColor: theme.background.tertiary,
                      }}
                    >
                      <Text
                        style={{
                          color: isMe ? theme.text.white : theme.text.primary,
                          fontSize: 15,
                        }}
                      >
                        {message.message}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          marginTop: 4,
                          color: isMe ? theme.text.whiteAlpha[90] : theme.text.tertiary,
                        }}
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
          <View style={{
            backgroundColor: theme.background.secondary,
            borderTopWidth: 1,
            borderTopColor: theme.background.tertiary,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Escribe un mensaje..."
                placeholderTextColor={theme.text.tertiary}
                style={{
                  flex: 1,
                  backgroundColor: theme.background.tertiary,
                  borderRadius: theme.borderRadius.lg,
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.md,
                  color: theme.text.primary,
                  fontSize: 15,
                }}
                multiline
                maxLength={500}
                autoComplete="off"
                textContentType="none"
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!messageText.trim() || sending}
                style={{
                  backgroundColor: theme.primary.main,
                  borderRadius: theme.borderRadius.lg,
                  paddingHorizontal: theme.spacing.xxxl,
                  paddingVertical: theme.spacing.md,
                }}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator color={theme.text.white} size="small" />
                ) : (
                  <Text style={{ color: theme.text.white, fontWeight: '700' }}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
