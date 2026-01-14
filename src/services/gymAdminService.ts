// Servicio para crear usuarios admin de gym
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from './firebase';

export const gymAdminService = {
  // Crear usuario admin de gym
  async createGymAdmin(
    email: string,
    password: string,
    displayName: string,
    gymId: string
  ): Promise<string> {
    try {
      // Crear usuario en Firebase Auth
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
        userType: 'gym',
        gymId,
        role: 'admin',
        createdAt: serverTimestamp(),
      };

      if (userCredential.user.photoURL) {
        userData.photoURL = userCredential.user.photoURL;
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      return userCredential.user.uid;
    } catch (error: any) {
      console.error('Error creating gym admin:', error);
      throw new Error(error.message || 'No se pudo crear el usuario admin');
    }
  },
};
