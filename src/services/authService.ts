// Servicio de autenticación
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserType, GymUser } from '../types';

export const authService = {
  // Registrar nuevo usuario (solo personas - profesores o alumnos)
  async register(
    email: string,
    password: string,
    displayName: string,
    userType: UserType,
    role?: 'professor' | 'student' // Rol opcional: profesor o alumno
  ): Promise<FirebaseUser> {
    // Solo permitir registro de personas
    if (userType !== 'person') {
      throw new Error('Los gimnasios no pueden registrarse. Contacta al administrador del sistema.');
    }

    // Cerrar sesión si hay una sesión activa previa
    if (auth.currentUser) {
      await signOut(auth);
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    await updateProfile(userCredential.user, { displayName });

    // Crear documento de usuario en Firestore
    const userData: any = {
      email: userCredential.user.email!,
      displayName,
      userType: 'person',
      createdAt: serverTimestamp(),
    };

    // Si se especifica un rol, agregarlo (pero sin gymId todavía)
    if (role) {
      userData.role = role;
    }

    // Solo agregar photoURL si existe (Firestore no acepta undefined)
    if (userCredential.user.photoURL) {
      userData.photoURL = userCredential.user.photoURL;
    }

    await setDoc(doc(db, 'users', userCredential.user.uid), userData);

    return userCredential.user;
  },

  // Iniciar sesión
  async login(email: string, password: string): Promise<FirebaseUser> {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  },

  // Cerrar sesión
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Obtener datos del usuario desde Firestore
  async getUserData(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  },

  // Verificar si es admin del sistema (super admin)
  async isSystemAdmin(userId: string): Promise<boolean> {
    const adminDoc = await getDoc(doc(db, 'systemAdmins', userId));
    return adminDoc.exists();
  },
};
