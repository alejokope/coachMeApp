# CoachMe App - Documentación Completa

## ✅ Estado: App Completa

La aplicación está completamente implementada con todas las funcionalidades solicitadas.

## 🏗️ Arquitectura

### Tipos de Usuarios

1. **Admin del Sistema** (`systemAdmin`)
   - Creado manualmente en Firestore (`systemAdmins` collection)
   - Acceso al backoffice completo
   - Puede crear gimnasios y gestionar ejercicios

2. **Admin de Gimnasio** (`gym` userType, `admin` role)
   - Se crea desde Firebase Console (no puede registrarse)
   - Gestiona su gimnasio
   - Busca y envía solicitudes a profesores/alumnos
   - Dashboard con métricas

3. **Profesor** (`person` userType, `professor` role)
   - Se registra como persona
   - Acepta solicitudes de gimnasios
   - Crea rutinas (plantillas) en su galería
   - Asigna rutinas a sus alumnos
   - Busca y asigna alumnos del gym
   - Ve comentarios y progresos de alumnos

4. **Alumno** (`person` userType, `student` role)
   - Se registra como persona
   - Acepta solicitudes de gimnasios
   - Recibe rutinas asignadas por su profesor
   - Modo entrenamiento mejorado
   - Envía mensajes y comentarios al profesor

5. **Persona** (`person` userType, sin role)
   - Rutinas personales
   - No pertenece a ningún gym

## 📱 Flujos Principales

### 1. Flujo de Autenticación

- **Gym**: Solo login (no puede registrarse)
- **Person**: Login y registro

### 2. Flujo de Solicitudes

- **Gym → Person**: Admin busca usuarios y envía solicitudes
- **Person → Gym**: Persona puede solicitar unirse (futuro)
- Ambos pueden aceptar/rechazar

### 3. Flujo de Rutinas

- **Profesor**: Crea plantillas → Asigna a alumnos
- **Alumno**: Recibe rutina → Entrena → Comenta
- **Persona**: Crea rutinas personales

### 4. Modo Entrenamiento

1. Seleccionar día
2. Seleccionar ejercicio (no ordenado)
3. Realizar series
4. Contador de descanso con notificaciones
5. Agregar comentarios

## 🗂️ Estructura de Firestore

### Colecciones

- `users` - Todos los usuarios
- `systemAdmins` - Admins del sistema
- `gyms` - Gimnasios
- `exercises` - Ejercicios (globales y por gym)
- `routines` - Rutinas plantilla
- `assignedRoutines` - Rutinas asignadas a alumnos
- `gymRequests` - Solicitudes entre gym y personas
- `workoutComments` - Comentarios durante entrenamientos
- `messages` - Mensajes entre usuarios
- `personalMaxs` - Máximos personales

## 🎯 Funcionalidades Implementadas

### Admin del Sistema
- ✅ Gestión de gimnasios (CRUD)
- ✅ Gestión de ejercicios (CRUD)
- ✅ Distribución de profesores por gym
- ✅ Seed de ejercicios iniciales

### Admin de Gimnasio
- ✅ Dashboard con métricas
- ✅ Búsqueda de usuarios
- ✅ Envío de solicitudes
- ✅ Gestión de solicitudes recibidas

### Profesor
- ✅ Galería de rutinas (plantillas)
- ✅ Crear rutinas personalizadas
- ✅ Asignar rutinas a alumnos
- ✅ Buscar alumnos del gym
- ✅ Asignar alumnos a sí mismo
- ✅ Ver solicitudes y aceptar/rechazar
- ✅ Detalle de alumnos (rutinas, comentarios, progresos)
- ✅ Ver comentarios de entrenamientos

### Alumno
- ✅ Ver rutinas asignadas
- ✅ Modo entrenamiento mejorado
- ✅ Selección de día y ejercicio
- ✅ Contador de descanso con notificaciones
- ✅ Agregar comentarios
- ✅ Ver solicitudes y aceptar/rechazar
- ✅ Mensajes con profesor
- ✅ Ver perfil del profesor
- ✅ Máximos personales

### Persona
- ✅ Crear rutinas personales
- ✅ Ver rutinas personales

## 🔔 Notificaciones

- Implementadas con `expo-notifications`
- Notificación cuando termina el descanso
- Funciona incluso si la app está minimizada

## 📝 Notas Importantes

1. **Crear Admin de Gym**: 
   - Crear gimnasio desde backoffice
   - Crear usuario en Firebase Authentication
   - Crear documento en `users` con `userType: 'gym'`, `gymId: <gymId>`, `role: 'admin'`

2. **Primer Admin del Sistema**:
   - El primer usuario que se registre como "Gym" se convierte automáticamente en admin del sistema

3. **Ejercicios Iniciales**:
   - Usar el botón "Agregar Ejercicios Base" en la pantalla de ejercicios del admin del sistema

## 🚀 Próximos Pasos (Opcional)

- [ ] Mejoras de UI/UX adicionales
- [ ] Estadísticas avanzadas
- [ ] Exportar rutinas
- [ ] Notificaciones push
- [ ] Modo offline mejorado
