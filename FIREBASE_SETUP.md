# Configuración de Firebase

Para que la aplicación funcione, necesitas configurar Firebase. Sigue estos pasos:

## 1. Crear un proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Authentication** con **Email/Password**
4. Crea una base de datos **Firestore** en modo de prueba (o producción si prefieres)

## 2. Obtener las credenciales

### Opción A: Para desarrollo con Expo Go (Recomendado para empezar)

1. En Firebase Console, ve a **Configuración del proyecto** (ícono de engranaje)
2. En "Tus aplicaciones", haz clic en **Agregar app** y selecciona **Web** (</>)
3. Registra tu app con un nombre (ej: "CoachMe Web")
4. Copia el objeto de configuración que aparece (firebaseConfig)

### Opción B: Para build nativo (Producción)

Si vas a hacer un build nativo con EAS Build o crear APK/IPA:

**Para Android:**
1. En Firebase Console, agrega una app **Android**
2. Ingresa el package name de tu app (puedes verlo en `app.json` bajo `android.package`)
3. Descarga el archivo `google-services.json`
4. Colócalo en la raíz del proyecto: `./google-services.json`

**Para iOS:**
1. En Firebase Console, agrega una app **iOS**
2. Ingresa el Bundle ID de tu app
3. Descarga el archivo `GoogleService-Info.plist`
4. Colócalo en la raíz del proyecto: `./GoogleService-Info.plist`

## 3. Configurar en la app

### Para desarrollo (Expo Go)

Edita el archivo `src/services/firebase.ts` y reemplaza los valores con las credenciales de la app **Web**:

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### Para producción (Build nativo)

Si tienes los archivos `google-services.json` y `GoogleService-Info.plist`, Expo los detectará automáticamente. También necesitas:

1. Instalar el plugin de Firebase para Expo:
```bash
npx expo install @react-native-firebase/app
```

2. Configurar en `app.json`:
```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app"
    ],
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

**Nota:** Para desarrollo, solo necesitas el objeto de configuración. Los archivos `google-services.json` son necesarios solo para builds nativos.

## 4. Estructura de Firestore

La aplicación creará automáticamente estas colecciones:

- `users` - Usuarios de la aplicación
- `systemAdmins` - Administradores del sistema (para el backoffice)
- `gyms` - Gimnasios registrados
- `exercises` - Ejercicios del sistema
- `routines` - Rutinas creadas
- `assignedRoutines` - Rutinas asignadas a alumnos
- `gymRequests` - Solicitudes de ingreso a gimnasios
- `personalMaxs` - Máximos personales de usuarios
- `workoutComments` - Comentarios durante entrenamientos

## 5. Crear un admin del sistema

Para acceder al backoffice, necesitas crear un documento en la colección `systemAdmins`:

1. Ve a Firestore en Firebase Console
2. Crea la colección `systemAdmins`
3. Crea un documento con el ID igual al `uid` de tu usuario de Firebase
4. El documento puede estar vacío o tener cualquier campo

## Reglas de Seguridad (Firestore)

Asegúrate de configurar reglas de seguridad apropiadas. Aquí un ejemplo básico:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer/escribir su propio documento
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // System admins pueden leer/escribir todo
    match /{document=**} {
      allow read, write: if exists(/databases/$(database)/documents/systemAdmins/$(request.auth.uid));
    }
    
    // Reglas específicas para cada colección (ajustar según necesidades)
  }
}
```
