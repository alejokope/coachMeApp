// Servicio de comentarios con Firestore
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { WorkoutComment } from '../types';

export const commentService = {
  // Obtener comentarios de una rutina
  async getRoutineComments(routineId: string): Promise<WorkoutComment[]> {
    try {
      const commentsRef = collection(db, 'workoutComments');
      const q = query(commentsRef, where('routineId', '==', routineId));
      const snapshot = await getDocs(q);
      
      const comments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as WorkoutComment[];
      
      // Ordenar en memoria por fecha
      return comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  },

  // Obtener todos los comentarios (para profesores)
  async getAllComments(): Promise<WorkoutComment[]> {
    try {
      const commentsRef = collection(db, 'workoutComments');
      const snapshot = await getDocs(commentsRef);
      
      const comments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as WorkoutComment[];
      
      // Ordenar en memoria por fecha
      return comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting all comments:', error);
      return [];
    }
  },

  // Crear comentario
  async createComment(comment: Omit<WorkoutComment, 'id' | 'createdAt'>): Promise<WorkoutComment> {
    try {
      const commentsRef = collection(db, 'workoutComments');
      const docRef = await addDoc(commentsRef, {
        ...comment,
        createdAt: serverTimestamp(),
      });
      
      const docSnap = await getDoc(docRef);
      return {
        id: docRef.id,
        ...docSnap.data(),
        createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
      } as WorkoutComment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },
};
