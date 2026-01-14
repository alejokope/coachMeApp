// Servicio de mensajes entre usuarios
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Message } from '../types';

export const messageService = {
  // Enviar mensaje
  async sendMessage(
    fromUserId: string,
    toUserId: string,
    message: string,
    routineId?: string
  ): Promise<Message> {
    try {
      const messagesRef = collection(db, 'messages');
      const docRef = await addDoc(messagesRef, {
        fromUserId,
        toUserId,
        message,
        routineId: routineId || null,
        read: false,
        createdAt: serverTimestamp(),
      });

      const newMessage = await getDoc(docRef);
      return {
        id: newMessage.id,
        ...newMessage.data(),
        createdAt: newMessage.data()?.createdAt?.toDate() || new Date(),
      } as Message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Obtener conversación entre dos usuarios
  async getConversation(
    userId1: string,
    userId2: string
  ): Promise<Message[]> {
    try {
      const messagesRef = collection(db, 'messages');
      
      // Obtener mensajes en ambas direcciones
      const [messages1, messages2] = await Promise.all([
        getDocs(
          query(
            messagesRef,
            where('fromUserId', '==', userId1),
            where('toUserId', '==', userId2)
          )
        ),
        getDocs(
          query(
            messagesRef,
            where('fromUserId', '==', userId2),
            where('toUserId', '==', userId1)
          )
        ),
      ]);

      const allMessages = [
        ...messages1.docs,
        ...messages2.docs,
      ].map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Message[];

      // Ordenar por fecha
      return allMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } catch (error) {
      console.error('Error getting conversation:', error);
      return [];
    }
  },

  // Obtener mensajes no leídos de un usuario
  async getUnreadMessages(userId: string): Promise<Message[]> {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('toUserId', '==', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Message[];
    } catch (error) {
      console.error('Error getting unread messages:', error);
      return [];
    }
  },

  // Marcar mensaje como leído
  async markAsRead(messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        read: true,
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  // Marcar todos los mensajes de una conversación como leídos
  async markConversationAsRead(
    userId1: string,
    userId2: string
  ): Promise<void> {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('fromUserId', '==', userId2),
        where('toUserId', '==', userId1),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      
      const updates = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );
      
      await Promise.all(updates);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },
};
