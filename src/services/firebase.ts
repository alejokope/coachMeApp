// Configuración de Firebase
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCsEh-endXhs8XwdLE2mLQpRLS6oi_DYLs",
  authDomain: "coachmeapp-b5b1a.firebaseapp.com",
  projectId: "coachmeapp-b5b1a",
  storageBucket: "coachmeapp-b5b1a.firebasestorage.app",
  messagingSenderId: "353494232771",
  appId: "1:353494232771:web:eb2f0dd12d3451ca38bc76"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Inicializar Firebase solo una vez
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  
  // Inicializar Auth - Firebase Auth en React Native persiste automáticamente
  // cuando AsyncStorage está instalado (ya lo tenemos)
  auth = getAuth(app);
  
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
