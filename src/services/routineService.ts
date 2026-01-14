// Servicio de rutinas con Firestore
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Routine } from '../types';

export const routineService = {
  // Obtener todas las rutinas de un profesor (o persona)
  async getProfessorRoutines(professorId: string): Promise<Routine[]> {
    try {
      const routinesRef = collection(db, 'routines');
      // Filtrar por professorId
      const q = query(
        routinesRef,
        where('professorId', '==', professorId)
      );
      const snapshot = await getDocs(q);
      
      const routines = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Routine[];
      
      // Ordenar en memoria por fecha de creación
      return routines.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting routines:', error);
      return [];
    }
  },

  // Obtener rutinas asignadas a un alumno
  async getStudentRoutines(studentId: string): Promise<any[]> {
    try {
      const routinesRef = collection(db, 'assignedRoutines');
      // Filtrar por studentId y status, ordenar en memoria
      const q = query(
        routinesRef,
        where('studentId', '==', studentId),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      
      const routines = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        assignedAt: doc.data().assignedAt?.toDate() || new Date(),
      }));
      
      // Ordenar en memoria por fecha de asignación
      return routines.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
    } catch (error) {
      console.error('Error getting student routines:', error);
      return [];
    }
  },

  // Crear nueva rutina
  async createRoutine(
    routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'> & { userType?: 'person' }
  ): Promise<Routine> {
    try {
      const routinesRef = collection(db, 'routines');
      const docRef = await addDoc(routinesRef, {
        ...routine,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      const docSnap = await getDoc(docRef);
      return {
        id: docRef.id,
        ...docSnap.data(),
        createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
      } as Routine;
    } catch (error) {
      console.error('Error creating routine:', error);
      throw error;
    }
  },

  // Actualizar rutina
  async updateRoutine(
    routineId: string,
    updates: Partial<Routine>
  ): Promise<Routine> {
    try {
      const routineRef = doc(db, 'routines', routineId);
      await updateDoc(routineRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      const updatedDoc = await getDoc(routineRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        createdAt: updatedDoc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: updatedDoc.data()?.updatedAt?.toDate() || new Date(),
      } as Routine;
    } catch (error) {
      console.error('Error updating routine:', error);
      throw error;
    }
  },

  // Actualizar rutina asignada
  async updateAssignedRoutine(
    routineId: string,
    updates: any
  ): Promise<any> {
    try {
      const routineRef = doc(db, 'assignedRoutines', routineId);
      await updateDoc(routineRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      const updatedDoc = await getDoc(routineRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        createdAt: updatedDoc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: updatedDoc.data()?.updatedAt?.toDate() || new Date(),
        assignedAt: updatedDoc.data()?.assignedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error updating assigned routine:', error);
      throw error;
    }
  },

  // Eliminar rutina
  async deleteRoutine(routineId: string): Promise<void> {
    try {
      const routineRef = doc(db, 'routines', routineId);
      await deleteDoc(routineRef);
    } catch (error) {
      console.error('Error deleting routine:', error);
      throw error;
    }
  },

  // Asignar rutina a un alumno
  async assignRoutineToStudent(
    routineId: string,
    studentId: string
  ): Promise<any> {
    try {
      // Obtener la rutina template
      const routineRef = doc(db, 'routines', routineId);
      const routineDoc = await getDoc(routineRef);

      if (!routineDoc.exists()) {
        throw new Error('Template routine not found');
      }

      const templateRoutine = {
        id: routineDoc.id,
        ...routineDoc.data(),
      };

      // Crear una copia en assignedRoutines
      const assignedRef = collection(db, 'assignedRoutines');
      const docRef = await addDoc(assignedRef, {
        ...templateRoutine,
        studentId,
        isTemplate: false,
        status: 'active',
        currentDay: 1,
        assignedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const assignedDoc = await getDoc(docRef);
      return {
        id: docRef.id,
        ...assignedDoc.data(),
        createdAt: assignedDoc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: assignedDoc.data()?.updatedAt?.toDate() || new Date(),
        assignedAt: assignedDoc.data()?.assignedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error assigning routine:', error);
      throw error;
    }
  },

  // Obtener rutina por ID
  async getRoutineById(routineId: string): Promise<Routine | null> {
    try {
      const routineRef = doc(db, 'routines', routineId);
      const routineDoc = await getDoc(routineRef);

      if (routineDoc.exists()) {
        return {
          id: routineDoc.id,
          ...routineDoc.data(),
          createdAt: routineDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: routineDoc.data().updatedAt?.toDate() || new Date(),
        } as Routine;
      }
      return null;
    } catch (error) {
      console.error('Error getting routine:', error);
      return null;
    }
  },

  // Obtener rutina asignada por ID
  async getAssignedRoutineById(routineId: string): Promise<any | null> {
    try {
      const routineRef = doc(db, 'assignedRoutines', routineId);
      const routineDoc = await getDoc(routineRef);

      if (routineDoc.exists()) {
        return {
          id: routineDoc.id,
          ...routineDoc.data(),
          createdAt: routineDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: routineDoc.data().updatedAt?.toDate() || new Date(),
          assignedAt: routineDoc.data().assignedAt?.toDate() || new Date(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting assigned routine:', error);
      return null;
    }
  },
};
