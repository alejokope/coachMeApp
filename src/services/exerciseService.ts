// Servicio de ejercicios con Firestore
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  deleteField,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Exercise } from '../types';

export const exerciseService = {
  // Obtener todos los ejercicios (globales y del gym)
  async getAllExercises(gymId?: string): Promise<Exercise[]> {
    try {
      const exercisesRef = collection(db, 'exercises');
      
      if (gymId) {
        // Ejercicios del gym o globales (sin gymId o gymId === null)
        // Obtenemos ejercicios del gym específico y también los globales
        const [gymExercisesSnapshot, allExercisesSnapshot] = await Promise.all([
          getDocs(query(exercisesRef, where('gymId', '==', gymId))),
          getDocs(exercisesRef) // Necesario para encontrar ejercicios globales sin campo gymId
        ]);
        
        // Crear un Set con IDs ya procesados para evitar duplicados
        const processedIds = new Set<string>();
        const allExercises: Exercise[] = [];
        
        // Agregar ejercicios del gym específico
        gymExercisesSnapshot.docs.forEach((doc) => {
          processedIds.add(doc.id);
          const data = doc.data();
          allExercises.push({
            id: doc.id,
            name: data.name || '',
            description: data.description || undefined,
            muscleGroups: Array.isArray(data.muscleGroups) ? data.muscleGroups : [],
            videoUrl: data.videoUrl || undefined,
            gymId: data.gymId || undefined,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Exercise);
        });
        
        // Agregar ejercicios globales (sin gymId o gymId === null)
        allExercisesSnapshot.docs.forEach((doc) => {
          if (!processedIds.has(doc.id)) {
            const data = doc.data();
            // Ejercicio global si no tiene gymId o gymId es null
            if (!data.gymId || data.gymId === null) {
              processedIds.add(doc.id);
              allExercises.push({
                id: doc.id,
                name: data.name || '',
                description: data.description || undefined,
                muscleGroups: Array.isArray(data.muscleGroups) ? data.muscleGroups : [],
                videoUrl: data.videoUrl || undefined,
                gymId: data.gymId || undefined,
                createdAt: data.createdAt?.toDate() || new Date(),
              } as Exercise);
            }
          }
        });
        
        // Ordenar por fecha de creación
        return allExercises.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      } else {
        // Solo ejercicios globales (sin gymId o gymId === null)
        // Obtener todos y filtrar en memoria
        const snapshot = await getDocs(exercisesRef);
        const exercises = snapshot.docs
          .filter((doc) => {
            const data = doc.data();
            // Ejercicio global si no tiene gymId o gymId es null
            return !data.gymId || data.gymId === null;
          })
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || '',
              description: data.description || undefined,
              muscleGroups: Array.isArray(data.muscleGroups) ? data.muscleGroups : [],
              videoUrl: data.videoUrl || undefined,
              gymId: data.gymId || undefined,
              createdAt: data.createdAt?.toDate() || new Date(),
            } as Exercise;
          });
        
        // Ordenar en memoria
        return exercises.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
    } catch (error) {
      console.error('Error getting exercises:', error);
      return [];
    }
  },

  // Buscar ejercicios por nombre o grupos musculares
  async searchExercises(searchTerm: string, gymId?: string): Promise<Exercise[]> {
    try {
      const allExercises = await this.getAllExercises(gymId);
      const searchLower = searchTerm.toLowerCase();
      
      return allExercises.filter((exercise) => {
        const nameMatch = exercise.name?.toLowerCase().includes(searchLower) || false;
        const muscleGroups = Array.isArray(exercise.muscleGroups) ? exercise.muscleGroups : [];
        const muscleMatch = muscleGroups.some((group) =>
          group?.toLowerCase().includes(searchLower)
        );
        const descMatch = exercise.description?.toLowerCase().includes(searchLower) || false;
        
        return nameMatch || muscleMatch || descMatch;
      });
    } catch (error) {
      console.error('Error searching exercises:', error);
      return [];
    }
  },

  // Crear nuevo ejercicio
  async createExercise(exercise: Omit<Exercise, 'id' | 'createdAt'>): Promise<Exercise> {
    try {
      const exercisesRef = collection(db, 'exercises');
      
      // Preparar datos sin campos undefined
      const exerciseData: any = {
        name: exercise.name,
        muscleGroups: exercise.muscleGroups,
        gymId: exercise.gymId || null,
        createdAt: serverTimestamp(),
      };
      
      // Solo agregar description si existe
      if (exercise.description && exercise.description.trim()) {
        exerciseData.description = exercise.description.trim();
      } else {
        exerciseData.description = null;
      }
      
      // Solo agregar videoUrl si existe y no está vacío
      if (exercise.videoUrl && exercise.videoUrl.trim()) {
        exerciseData.videoUrl = exercise.videoUrl.trim();
      }
      // No agregar el campo si está vacío (Firestore no acepta undefined ni strings vacíos)
      
      const docRef = await addDoc(exercisesRef, exerciseData);

      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      return {
        id: docRef.id,
        name: data?.name || '',
        description: data?.description || undefined,
        muscleGroups: Array.isArray(data?.muscleGroups) ? data.muscleGroups : [],
        videoUrl: data?.videoUrl || undefined,
        gymId: data?.gymId || undefined,
        createdAt: data?.createdAt?.toDate() || new Date(),
      } as Exercise;
    } catch (error) {
      console.error('Error creating exercise:', error);
      throw error;
    }
  },

  // Actualizar ejercicio
  async updateExercise(
    id: string,
    exercise: Partial<Omit<Exercise, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const exerciseRef = doc(db, 'exercises', id);
      
      // Preparar datos sin campos undefined
      const updateData: any = {};
      
      if (exercise.name !== undefined) updateData.name = exercise.name;
      if (exercise.muscleGroups !== undefined) updateData.muscleGroups = exercise.muscleGroups;
      if (exercise.gymId !== undefined) updateData.gymId = exercise.gymId || null;
      
      // Manejar description
      if (exercise.description !== undefined) {
        if (exercise.description && exercise.description.trim()) {
          updateData.description = exercise.description.trim();
        } else {
          updateData.description = null;
        }
      }
      
      // Manejar videoUrl - solo agregar si tiene valor, si está vacío eliminar el campo
      if (exercise.videoUrl !== undefined) {
        if (exercise.videoUrl && exercise.videoUrl.trim()) {
          updateData.videoUrl = exercise.videoUrl.trim();
        } else {
          // Si está vacío, eliminar el campo de Firestore
          updateData.videoUrl = deleteField();
        }
      }
      
      await updateDoc(exerciseRef, updateData);
    } catch (error) {
      console.error('Error updating exercise:', error);
      throw error;
    }
  },

  // Eliminar ejercicio
  async deleteExercise(id: string): Promise<void> {
    try {
      const exerciseRef = doc(db, 'exercises', id);
      await deleteDoc(exerciseRef);
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  },
};
