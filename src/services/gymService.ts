// Servicio de gimnasios con Firestore
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Gym } from '../types';

export const gymService = {
  // Obtener todos los gimnasios
  async getAllGyms(): Promise<Gym[]> {
    try {
      const gymsRef = collection(db, 'gyms');
      const snapshot = await getDocs(gymsRef);
      
      const gyms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Gym[];
      
      // Ordenar en memoria por fecha
      return gyms.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting gyms:', error);
      return [];
    }
  },

  // Obtener gimnasio por ID
  async getGymById(gymId: string): Promise<Gym | null> {
    try {
      const gymRef = doc(db, 'gyms', gymId);
      const gymDoc = await getDoc(gymRef);
      
      if (gymDoc.exists()) {
        return {
          id: gymDoc.id,
          ...gymDoc.data(),
          createdAt: gymDoc.data().createdAt?.toDate() || new Date(),
        } as Gym;
      }
      return null;
    } catch (error) {
      console.error('Error getting gym:', error);
      return null;
    }
  },

  // Crear nuevo gimnasio
  async createGym(gym: Omit<Gym, 'id' | 'createdAt'>): Promise<Gym> {
    try {
      const gymsRef = collection(db, 'gyms');
      const docRef = await addDoc(gymsRef, {
        ...gym,
        createdAt: serverTimestamp(),
      });
      
      const docSnap = await getDoc(docRef);
      return {
        id: docRef.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      } as Gym;
    } catch (error) {
      console.error('Error creating gym:', error);
      throw error;
    }
  },

  // Actualizar gimnasio
  async updateGym(gymId: string, updates: Partial<Gym>): Promise<Gym> {
    try {
      const gymRef = doc(db, 'gyms', gymId);
      await updateDoc(gymRef, {
        ...updates,
      });
      
      const updatedDoc = await getDoc(gymRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        createdAt: updatedDoc.data().createdAt?.toDate() || new Date(),
      } as Gym;
    } catch (error) {
      console.error('Error updating gym:', error);
      throw error;
    }
  },

  // Eliminar gimnasio
  async deleteGym(gymId: string): Promise<void> {
    try {
      const gymRef = doc(db, 'gyms', gymId);
      await deleteDoc(gymRef);
    } catch (error) {
      console.error('Error deleting gym:', error);
      throw error;
    }
  },
};
