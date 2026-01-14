// Servicio de máximos personales con Firestore
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { PersonalMax } from '../types';

export const personalMaxService = {
  // Obtener máximos de un usuario
  async getUserMaxs(userId: string): Promise<PersonalMax[]> {
    try {
      const maxsRef = collection(db, 'personalMaxs');
      const q = query(maxsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as PersonalMax[];
    } catch (error) {
      console.error('Error getting personal maxs:', error);
      return [];
    }
  },

  // Obtener máximo de un ejercicio específico
  async getExerciseMax(userId: string, exerciseId: string): Promise<PersonalMax | null> {
    try {
      const maxsRef = collection(db, 'personalMaxs');
      const q = query(
        maxsRef,
        where('userId', '==', userId),
        where('exerciseId', '==', exerciseId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as PersonalMax;
    } catch (error) {
      console.error('Error getting exercise max:', error);
      return null;
    }
  },

  // Guardar o actualizar máximo personal
  async saveMax(max: Omit<PersonalMax, 'id' | 'updatedAt'>): Promise<PersonalMax> {
    try {
      // Buscar si ya existe
      const existing = await this.getExerciseMax(max.userId, max.exerciseId);
      
      if (existing) {
        // Actualizar
        const maxRef = doc(db, 'personalMaxs', existing.id);
        await updateDoc(maxRef, {
          maxWeight: max.maxWeight,
          maxReps: max.maxReps,
          updatedAt: serverTimestamp(),
        });
        
        const updatedDoc = await getDoc(maxRef);
        return {
          id: updatedDoc.id,
          ...updatedDoc.data(),
          updatedAt: updatedDoc.data()?.updatedAt?.toDate() || new Date(),
        } as PersonalMax;
      } else {
        // Crear nuevo
        const maxsRef = collection(db, 'personalMaxs');
        const docRef = doc(maxsRef);
        await setDoc(docRef, {
          ...max,
          updatedAt: serverTimestamp(),
        });
        
        const newDoc = await getDoc(docRef);
        return {
          id: docRef.id,
          ...newDoc.data(),
          updatedAt: newDoc.data()?.updatedAt?.toDate() || new Date(),
        } as PersonalMax;
      }
    } catch (error) {
      console.error('Error saving max:', error);
      throw error;
    }
  },
};
