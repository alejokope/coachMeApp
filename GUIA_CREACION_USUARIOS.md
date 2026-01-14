# Guía Completa: Cómo Crear Usuarios en CoachMe

## 📋 Resumen Rápido

| Tipo de Usuario | Cómo se Crea | Dónde |
|----------------|--------------|-------|
| **Admin del Sistema** | Manual en Firestore | Firebase Console |
| **Admin de Gimnasio** | Manual en Firebase Auth + Firestore | Firebase Console |
| **Profesor** | Se registra como Persona → Elige rol Profesor | App |
| **Alumno** | Se registra como Persona → Elige rol Alumno | App |
| **Persona** | Se registra como Persona (sin rol) | App |

---

## 🔧 Paso a Paso Detallado

### 1️⃣ Crear Admin del Sistema

**Cuándo:** Solo necesitas UN admin del sistema para gestionar toda la plataforma.

**Pasos:**

1. **Registra un usuario en la app:**
   - Abre la app
   - Selecciona "Soy una Persona" (o cualquier opción)
   - Regístrate con email y contraseña
   - **IMPORTANTE:** Este usuario debe existir en Firebase Authentication

2. **Obtén el UID del usuario:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Selecciona tu proyecto: `coachmeapp-b5b1a`
   - Ve a **Authentication** > **Users**
   - Encuentra el usuario que acabas de crear
   - Copia el **UID** (User ID) - algo como `abc123xyz456`

3. **Crear el admin en Firestore:**
   - En Firebase Console, ve a **Firestore Database**
   - Crea la colección `systemAdmins` (si no existe)
   - Crea un nuevo documento con el **ID igual al UID** que copiaste
   - El documento puede estar vacío o tener: `{ createdAt: timestamp }`
   - Guarda el documento

4. **Recarga la app:**
   - Cierra sesión y vuelve a iniciar sesión
   - Ahora deberías ver el backoffice de Admin del Sistema

---

### 2️⃣ Crear Gimnasio y su Admin

**Cuándo:** Cuando quieres agregar un nuevo gimnasio a la plataforma.

**Pasos:**

#### Paso A: Crear el Gimnasio (desde Admin del Sistema)

1. **Login como Admin del Sistema** en la app
2. Ve a la pestaña **"Gimnasios"**
3. Haz clic en **"+ Nuevo"**
4. Completa:
   - Nombre del gimnasio (ej: "Gym Fit")
   - Dirección (opcional)
   - Teléfono (opcional)
5. Haz clic en **"Guardar"**
6. **IMPORTANTE:** Anota el **ID del gimnasio** que se creó (lo verás en la lista)

#### Paso B: Crear el Usuario Admin del Gimnasio (desde Firebase Console)

1. **Ve a Firebase Console** > **Authentication** > **Users**
2. Haz clic en **"Add user"** o **"Agregar usuario"**
3. Completa:
   - Email: `admin@gymfit.com` (ejemplo)
   - Password: `password123` (ejemplo - el admin cambiará después)
4. Haz clic en **"Add user"**
5. **Copia el UID** del usuario recién creado

#### Paso C: Crear el Documento del Usuario en Firestore

1. En Firebase Console, ve a **Firestore Database**
2. Ve a la colección `users`
3. Crea un nuevo documento con el **ID igual al UID** que copiaste
4. Agrega estos campos:
   ```json
   {
     "email": "admin@gymfit.com",
     "displayName": "Admin Gym Fit",
     "userType": "gym",
     "gymId": "ID_DEL_GIMNASIO_QUE_CREASTE",
     "role": "admin",
     "createdAt": timestamp
   }
   ```
   - **gymId:** Pega el ID del gimnasio que anotaste en el Paso A
5. Guarda el documento

#### Paso D: Probar el Login

1. En la app, selecciona **"Soy un Gimnasio"**
2. Haz login con:
   - Email: `admin@gymfit.com`
   - Password: `password123`
3. Deberías ver el dashboard del Admin del Gimnasio

---

### 3️⃣ Crear Profesor

**Cuándo:** Cuando un profesor quiere usar la app.

**Pasos:**

1. **Abre la app**
2. Selecciona **"Soy una Persona"**
3. Haz clic en **"Regístrate"** (si no tienes cuenta) o **"Inicia Sesión"** (si ya tienes)
4. Si te registras:
   - Completa tu nombre
   - Email y contraseña
   - **Selecciona "Profesor"** en el selector de rol
5. Haz clic en **"Crear Cuenta"**
6. **Listo:** Ya eres un Profesor registrado (aún sin gym asignado)

#### Unirse a un Gimnasio:

1. El **Admin del Gym** te buscará y te enviará una solicitud
2. O puedes esperar a que te inviten
3. Cuando aceptes la solicitud, se te asignará el `gymId` automáticamente

---

### 4️⃣ Crear Alumno

**Cuándo:** Cuando un alumno quiere usar la app.

**Pasos:**

1. **Abre la app**
2. Selecciona **"Soy una Persona"**
3. Haz clic en **"Regístrate"** (si no tienes cuenta) o **"Inicia Sesión"** (si ya tienes)
4. Si te registras:
   - Completa tu nombre
   - Email y contraseña
   - **Selecciona "Alumno"** en el selector de rol
5. Haz clic en **"Crear Cuenta"**
6. **Listo:** Ya eres un Alumno registrado (aún sin gym asignado)

#### Unirse a un Gimnasio:

1. El **Admin del Gym** te buscará y te enviará una solicitud
2. O puedes esperar a que te inviten
3. Cuando aceptes la solicitud, se te asignará el `gymId` automáticamente

---

### 5️⃣ Crear Persona (sin rol específico)

**Cuándo:** Cuando alguien quiere usar la app solo para rutinas personales.

**Pasos:**

1. Abre la app
2. Selecciona **"Soy una Persona"**
3. Haz clic en **"Regístrate"**
4. Completa:
   - Nombre: "Pedro Personal"
   - Email: `pedro@email.com`
   - **NO selecciones ningún rol** (o deja sin seleccionar)
5. Se crea como **Persona** (sin gym, sin role)
6. Puede crear rutinas personales

---

## 🔄 Flujo Visual

```
1. Admin Sistema crea Gimnasio (desde app)
   ↓
2. Admin Sistema crea Usuario Admin del Gym (Firebase Console)
   ↓
3. Profesores/Alumnos se registran como "Persona" (desde app)
   - Seleccionan su rol: Profesor o Alumno
   ↓
4. Admin Gym busca usuarios y envía solicitudes (desde app)
   ↓
5. Profesores/Alumnos aceptan solicitudes → Se les asigna gymId automáticamente
```

---

## ⚠️ Puntos Importantes

1. **Los gimnasios NO se pueden registrar** - Solo se crean desde el backoffice del Admin del Sistema

2. **Los admins de gym NO se pueden registrar** - Se crean manualmente en Firebase Console

3. **Las personas SÍ se pueden registrar** - Desde la app, seleccionando "Soy una Persona"

4. **Al registrarse, las personas eligen si son Profesor o Alumno** - Esto se guarda en el campo `role`

5. **El `gymId` se asigna cuando aceptan una solicitud** - No al registrarse

6. **El Admin del Sistema es completamente separado** - Se crea manualmente en `systemAdmins`

---

## 🧪 Ejemplo Completo

### Escenario: Crear un gimnasio completo

1. **Crear Admin del Sistema** (una sola vez)
   - Registro/login en app como "Persona"
   - Crear documento en `systemAdmins` con su UID

2. **Crear Gimnasio "Gym Fit"**
   - Login como Admin Sistema
   - Crear gimnasio desde backoffice
   - Anotar ID: `gym-fit-123`

3. **Crear Admin del Gym**
   - Firebase Console > Auth > Crear usuario: `admin@gymfit.com`
   - Firestore > `users` > Crear documento con UID
   - Agregar: `userType: "gym"`, `gymId: "gym-fit-123"`, `role: "admin"`

4. **Crear Profesor**
   - Persona abre app > "Soy una Persona" > Registrarse
   - Selecciona "Profesor"
   - Se registra con `role: "professor"` (sin gymId todavía)
   - Admin Gym busca y envía solicitud
   - Profesor acepta → Se le asigna `gymId: "gym-fit-123"`

5. **Crear Alumno**
   - Persona abre app > "Soy una Persona" > Registrarse
   - Selecciona "Alumno"
   - Se registra con `role: "student"` (sin gymId todavía)
   - Admin Gym busca y envía solicitud
   - Alumno acepta → Se le asigna `gymId: "gym-fit-123"`

---

## 🆘 Troubleshooting

**Problema:** No puedo hacer login como Admin del Sistema
- **Solución:** Verifica que existe un documento en `systemAdmins` con tu UID

**Problema:** No puedo hacer login como Admin del Gym
- **Solución:** Verifica que el documento en `users` tiene `userType: "gym"` y `gymId` correcto

**Problema:** No aparecen solicitudes
- **Solución:** Verifica que el `gymId` en la solicitud coincide con el `gymId` del usuario

**Problema:** No puedo buscar usuarios
- **Solución:** Los usuarios deben estar registrados primero como "Persona"

**Problema:** No puedo seleccionar rol al registrarme
- **Solución:** Asegúrate de estar en modo "Registro" (no Login) y haber seleccionado "Soy una Persona"
