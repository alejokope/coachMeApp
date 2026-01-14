// Servicio para historial de entrenamientos
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { WorkoutSession } from '../types';

export const workoutHistoryService = {
  // Crear una nueva sesión de entrenamiento
  async createWorkoutSession(
    session: Omit<WorkoutSession, 'id' | 'startTime'>
  ): Promise<WorkoutSession> {
    try {
      const sessionsRef = collection(db, 'workoutSessions');
      const docRef = await addDoc(sessionsRef, {
        ...session,
        startTime: serverTimestamp(),
      });
      
      const docSnap = await getDoc(docRef);
      return {
        id: docRef.id,
        ...docSnap.data(),
        startTime: docSnap.data()?.startTime?.toDate() || new Date(),
        endTime: docSnap.data()?.endTime?.toDate() || undefined,
      } as WorkoutSession;
    } catch (error) {
      console.error('Error creating workout session:', error);
      throw error;
    }
  },

  // Actualizar sesión de entrenamiento
  async updateWorkoutSession(
    sessionId: string,
    updates: Partial<WorkoutSession>
  ): Promise<WorkoutSession> {
    try {
      const sessionRef = doc(db, 'workoutSessions', sessionId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      
      // Convertir fechas a timestamps
      if (updates.endTime) {
        updateData.endTime = serverTimestamp();
      }
      
      await updateDoc(sessionRef, updateData);
      
      const updatedDoc = await getDoc(sessionRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        startTime: updatedDoc.data()?.startTime?.toDate() || new Date(),
        endTime: updatedDoc.data()?.endTime?.toDate() || undefined,
      } as WorkoutSession;
    } catch (error) {
      console.error('Error updating workout session:', error);
      throw error;
    }
  },

  // Obtener historial de entrenamientos de un usuario
  async getUserWorkoutHistory(userId: string, limit?: number): Promise<WorkoutSession[]> {
    try {
      const sessionsRef = collection(db, 'workoutSessions');
      let q = query(
        sessionsRef,
        where('userId', '==', userId),
        orderBy('startTime', 'desc')
      );
      
      if (limit) {
        q = query(q, limit(limit));
      }
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || undefined,
      })) as WorkoutSession[];
    } catch (error) {
      console.error('Error getting workout history:', error);
      return [];
    }
  },

  // Obtener una sesión específica
  async getWorkoutSession(sessionId: string): Promise<WorkoutSession | null> {
    try {
      const sessionRef = doc(db, 'workoutSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (sessionDoc.exists()) {
        return {
          id: sessionDoc.id,
          ...sessionDoc.data(),
          startTime: sessionDoc.data().startTime?.toDate() || new Date(),
          endTime: sessionDoc.data().endTime?.toDate() || undefined,
        } as WorkoutSession;
      }
      return null;
    } catch (error) {
      console.error('Error getting workout session:', error);
      return null;
    }
  },
};
