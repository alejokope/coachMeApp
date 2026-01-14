// Contexto de autenticación con Firebase
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { authService } from '../services/authService';
import { User, GymUser } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isSystemAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, userType: 'gym' | 'person') => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        await loadUserData(firebaseUser.uid);
      } else {
        setUser(null);
        setIsSystemAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Cargar datos del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('=== DEBUG: Cargando usuario ===');
        console.log('User ID:', userId);
        console.log('Datos del documento:', data);
        console.log('userType:', data.userType);
        console.log('gymId:', data.gymId);
        console.log('role:', data.role);
        
        const userData = { id: userDoc.id, ...data } as User;
        const userWithDates = {
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
        };
        
        console.log('Usuario final:', userWithDates);
        console.log('=== FIN DEBUG ===');
        
        setUser(userWithDates);

        // Verificar si es admin del sistema
        const adminDoc = await getDoc(doc(db, 'systemAdmins', userId));
        setIsSystemAdmin(adminDoc.exists());
      } else {
        // Si no existe el documento, crear uno básico
        // Esto no debería pasar si el registro fue exitoso, pero lo manejamos por seguridad
        const basicUserData: any = {
          id: userId,
          email: firebaseUser?.email || '',
          displayName: firebaseUser?.displayName || 'Usuario',
          userType: 'person',
          createdAt: serverTimestamp(),
        };
        
        // Solo agregar photoURL si existe
        if (firebaseUser?.photoURL) {
          basicUserData.photoURL = firebaseUser.photoURL;
        }
        
        await setDoc(doc(db, 'users', userId), basicUserData);
        
        const basicUser: User = {
          id: userId,
          email: firebaseUser?.email || '',
          displayName: firebaseUser?.displayName || 'Usuario',
          userType: 'person',
          createdAt: new Date(),
        };
        setUser(basicUser);
        setIsSystemAdmin(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(null);
      setIsSystemAdmin(false);
    }
  };

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
    // El onAuthStateChanged se encargará de cargar los datos
  };

      const register = async (
        email: string,
        password: string,
        displayName: string,
        userType: 'gym' | 'person',
        role?: 'professor' | 'student'
      ) => {
        await authService.register(email, password, displayName, userType, role);
        // El onAuthStateChanged se encargará de cargar los datos
      };


  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsSystemAdmin(false);
  };

  const refreshUserData = async () => {
    if (firebaseUser) {
      await loadUserData(firebaseUser.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isSystemAdmin,
        login,
        register,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
