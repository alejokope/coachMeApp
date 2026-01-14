# Configuración de Admin del Sistema

## Cómo crear el primer Admin del Sistema

### Opción 1: Desde Firebase Console (Recomendado)

1. **Registra un usuario en la app:**
   - Abre la app
   - Selecciona "Soy un Gimnasio"
   - Regístrate con email y contraseña
   - Completa el registro

2. **Obtén el UID del usuario:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Selecciona tu proyecto: `coachmeapp-b5b1a`
   - Ve a **Authentication** > **Users**
   - Encuentra el usuario que acabas de crear
   - Copia el **UID** (User ID)

3. **Crear el admin en Firestore:**
   - Ve a **Firestore Database**
   - Crea la colección `systemAdmins` (si no existe)
   - Crea un nuevo documento con el **ID igual al UID** que copiaste
   - El documento puede estar vacío o tener cualquier campo (ej: `{ createdAt: timestamp }`)
   - Guarda el documento

4. **Recarga la app:**
   - Cierra sesión y vuelve a iniciar sesión
   - Ahora deberías ver el backoffice de Admin del Sistema

### Opción 2: Desde la App (Próximamente)

Se puede agregar una funcionalidad para que el primer usuario que se registre como "Gym" se convierta automáticamente en admin, o crear una pantalla especial para el primer setup.

## Verificar que eres Admin

- Deberías ver la pantalla "Backoffice" con tabs de:
  - Gimnasios
  - Ejercicios
  - Profesores

## Notas

- Solo los usuarios con documento en `systemAdmins` pueden acceder al backoffice
- Puedes crear múltiples admins del sistema
- El UID es único para cada usuario de Firebase Authentication
