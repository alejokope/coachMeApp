// Servicio de solicitudes entre gym y personas
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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { GymRequest, RequestType, PersonRole, RequestStatus } from '../types';

export const requestService = {
  // Crear solicitud (gym busca persona o persona busca gym)
  async createRequest(
    userId: string,
    gymId: string,
    requestedRole: PersonRole,
    requestType: RequestType,
    message?: string
  ): Promise<GymRequest> {
    try {
      // Verificar que no exista una solicitud pendiente
      const existingRequest = await this.getPendingRequest(userId, gymId, requestedRole);
      if (existingRequest) {
        throw new Error('Ya existe una solicitud pendiente');
      }

      const requestsRef = collection(db, 'gymRequests');
      const docRef = await addDoc(requestsRef, {
        userId,
        gymId,
        requestedRole,
        requestType,
        status: 'pending' as RequestStatus,
        message: message || null,
        createdAt: serverTimestamp(),
      });

      const newRequest = await getDoc(docRef);
      return {
        id: newRequest.id,
        ...newRequest.data(),
        createdAt: newRequest.data()?.createdAt?.toDate() || new Date(),
        reviewedAt: newRequest.data()?.reviewedAt?.toDate(),
      } as GymRequest;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  },

  // Obtener solicitud pendiente
  async getPendingRequest(
    userId: string,
    gymId: string,
    requestedRole: PersonRole
  ): Promise<GymRequest | null> {
    try {
      const requestsRef = collection(db, 'gymRequests');
      const q = query(
        requestsRef,
        where('userId', '==', userId),
        where('gymId', '==', gymId),
        where('requestedRole', '==', requestedRole),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate(),
      } as GymRequest;
    } catch (error) {
      console.error('Error getting pending request:', error);
      return null;
    }
  },

  // Obtener todas las solicitudes pendientes de un gym para múltiples usuarios
  async getPendingRequestsForUsers(
    userIds: string[],
    gymId: string
  ): Promise<Map<string, GymRequest>> {
    try {
      if (userIds.length === 0) return new Map();
      
      const requestsRef = collection(db, 'gymRequests');
      const q = query(
        requestsRef,
        where('gymId', '==', gymId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      
      const pendingRequestsMap = new Map<string, GymRequest>();
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId;
        
        // Solo incluir si el userId está en la lista de usuarios buscados
        if (userIds.includes(userId)) {
          pendingRequestsMap.set(userId, {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            reviewedAt: data.reviewedAt?.toDate(),
          } as GymRequest);
        }
      });
      
      return pendingRequestsMap;
    } catch (error) {
      console.error('Error getting pending requests for users:', error);
      return new Map();
    }
  },

  // Obtener solicitudes de un gimnasio
  async getGymRequests(gymId: string, status?: RequestStatus): Promise<GymRequest[]> {
    try {
      const requestsRef = collection(db, 'gymRequests');
      let q;
      
      if (status) {
        q = query(
          requestsRef,
          where('gymId', '==', gymId),
          where('status', '==', status)
        );
      } else {
        q = query(requestsRef, where('gymId', '==', gymId));
      }
      
      const snapshot = await getDocs(q);
      
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate(),
      })) as GymRequest[];
      
      // Ordenar en memoria por fecha de creación
      return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting gym requests:', error);
      return [];
    }
  },

  // Obtener solicitudes de una persona
  async getUserRequests(userId: string, status?: RequestStatus): Promise<GymRequest[]> {
    try {
      console.log('requestService.getUserRequests: Buscando solicitudes para userId:', userId);
      console.log('requestService.getUserRequests: Tipo de userId:', typeof userId);
      console.log('requestService.getUserRequests: Status filter:', status);
      
      // Primero, obtener TODAS las solicitudes para debuggear
      const allRequestsRef = collection(db, 'gymRequests');
      const allSnapshot = await getDocs(allRequestsRef);
      console.log('requestService.getUserRequests: Total solicitudes en la BD:', allSnapshot.docs.length);
      
      allSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log('requestService.getUserRequests: Solicitud encontrada:', {
          docId: doc.id,
          userId: data.userId,
          userIdType: typeof data.userId,
          userIdMatch: data.userId === userId,
          gymId: data.gymId,
          status: data.status,
          requestType: data.requestType,
        });
      });
      
      const requestsRef = collection(db, 'gymRequests');
      let q;
      
      if (status) {
        q = query(
          requestsRef,
          where('userId', '==', userId),
          where('status', '==', status)
        );
      } else {
        q = query(requestsRef, where('userId', '==', userId));
      }
      
      const snapshot = await getDocs(q);
      console.log('requestService.getUserRequests: Total documentos encontrados con filtro:', snapshot.docs.length);
      
      const requests = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('requestService.getUserRequests: Documento filtrado:', doc.id, 'Data:', data);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
        };
      }) as GymRequest[];
      
      console.log('requestService.getUserRequests: Solicitudes procesadas:', requests.length);
      
      // Ordenar en memoria por fecha de creación
      return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting user requests:', error);
      return [];
    }
  },

  // Aceptar solicitud
  async acceptRequest(
    requestId: string,
    reviewedBy: string
  ): Promise<void> {
    try {
      const requestRef = doc(db, 'gymRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Solicitud no encontrada');
      }

      const requestData = requestDoc.data() as GymRequest;
      
      // Actualizar solicitud
      await updateDoc(requestRef, {
        status: 'accepted' as RequestStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy,
      });

      // Actualizar usuario en Firestore
      const userRef = doc(db, 'users', requestData.userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const updateData: any = {
          gymId: requestData.gymId,
          role: requestData.requestedRole,
        };

        // Si es alumno, no asignamos profesor todavía (se hace después)
        // Si es profesor, ya está listo
        await updateDoc(userRef, updateData);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      throw error;
    }
  },

  // Rechazar solicitud
  async rejectRequest(
    requestId: string,
    reviewedBy: string
  ): Promise<void> {
    try {
      const requestRef = doc(db, 'gymRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected' as RequestStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy,
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  },

  // Eliminar solicitud
  async deleteRequest(requestId: string): Promise<void> {
    try {
      const requestRef = doc(db, 'gymRequests', requestId);
      await deleteDoc(requestRef);
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  },
};
