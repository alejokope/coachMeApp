// Servicio para obtener usuarios y métricas
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, PersonUser, GymUser } from '../types';

export const userService = {
  // Buscar usuarios por email o nombre
  async searchUsers(searchTerm: string): Promise<PersonUser[]> {
    try {
      console.log('userService.searchUsers: Buscando término:', searchTerm);
      
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      console.log('userService.searchUsers: Total documentos en users:', snapshot.docs.length);
      
      const allUsers = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || '',
            displayName: data.displayName || '',
            userType: data.userType || 'person',
            role: data.role || undefined,
            gymId: data.gymId || undefined,
            professorId: data.professorId || undefined,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        }) as User[];

      console.log('userService.searchUsers: Usuarios mapeados:', allUsers.length);
      console.log('userService.searchUsers: Tipos de usuario encontrados:', [...new Set(allUsers.map(u => u.userType))]);

      // Filtrar solo personas
      const persons = allUsers.filter((user) => user.userType === 'person');
      console.log('userService.searchUsers: Usuarios tipo person:', persons.length);
      
      // Normalizar término de búsqueda (quitar espacios extra, normalizar)
      const normalizedSearchTerm = searchTerm.trim().toLowerCase().replace(/\s+/g, ' ');
      
      // Función para normalizar texto para búsqueda
      const normalizeText = (text: string): string => {
        return text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
          .replace(/\s+/g, ' ') // Normalizar espacios
          .trim();
      };
      
      const filtered = persons.filter((user) => {
        const email = normalizeText(user.email || '');
        const displayName = normalizeText(user.displayName || '');
        const searchNormalized = normalizeText(searchTerm);
        
        // Buscar en email completo o partes del email
        const emailMatch = email.includes(searchNormalized) || 
                          email.split('@')[0]?.includes(searchNormalized);
        
        // Buscar en nombre completo o palabras individuales
        const nameWords = displayName.split(' ');
        const nameMatch = displayName.includes(searchNormalized) ||
                         nameWords.some(word => word.startsWith(searchNormalized));
        
        const matches = emailMatch || nameMatch;
        
        if (matches) {
          console.log('userService.searchUsers: Usuario encontrado:', {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            gymId: user.gymId,
            role: user.role,
          });
        }
        
        return matches;
      }) as PersonUser[];

      console.log('userService.searchUsers: Usuarios filtrados por término:', filtered.length);
      console.log('userService.searchUsers: IDs encontrados:', filtered.map(u => u.id));
      
      return filtered;
    } catch (error) {
      console.error('userService.searchUsers: Error searching users:', error);
      return [];
    }
  },

  // Obtener todos los usuarios de un gym
  async getGymUsers(gymId: string): Promise<PersonUser[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('gymId', '==', gymId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as PersonUser[];
    } catch (error) {
      console.error('Error getting gym users:', error);
      return [];
    }
  },

  // Obtener profesores de un gym
  async getGymProfessors(gymId: string): Promise<PersonUser[]> {
    try {
      const users = await this.getGymUsers(gymId);
      return users.filter((user) => user.role === 'professor');
    } catch (error) {
      console.error('Error getting gym professors:', error);
      return [];
    }
  },

  // Obtener alumnos de un gym
  async getGymStudents(gymId: string): Promise<PersonUser[]> {
    try {
      const users = await this.getGymUsers(gymId);
      return users.filter((user) => user.role === 'student');
    } catch (error) {
      console.error('Error getting gym students:', error);
      return [];
    }
  },

  // Obtener alumno por ID
  async getStudentById(studentId: string): Promise<PersonUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', studentId));
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data(),
          createdAt: userDoc.data().createdAt?.toDate() || new Date(),
        } as PersonUser;
      }
      return null;
    } catch (error) {
      console.error('Error getting student:', error);
      return null;
    }
  },

  // Obtener profesor por ID
  async getProfessorById(professorId: string): Promise<PersonUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', professorId));
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data(),
          createdAt: userDoc.data().createdAt?.toDate() || new Date(),
        } as PersonUser;
      }
      return null;
    } catch (error) {
      console.error('Error getting professor:', error);
      return null;
    }
  },
};
