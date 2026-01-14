// Tipos principales de la aplicación

export type UserType = 'gym' | 'person';

export type PersonRole = 'professor' | 'student'; // Person puede ser profesor o alumno

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export type RequestType = 'gym_to_person' | 'person_to_gym'; // Quién envía la solicitud

// Usuario base
export interface User {
  id: string;
  email: string;
  displayName: string;
  userType: UserType;
  createdAt: Date;
  photoURL?: string;
}

// Usuario de Gym (solo admin, se crea desde backoffice)
export interface GymUser extends User {
  userType: 'gym';
  gymId: string; // Obligatorio, siempre tiene un gym asociado
  role: 'admin'; // Solo puede ser admin
}

// Usuario Persona (puede ser profesor o alumno)
export interface PersonUser extends User {
  userType: 'person';
  role?: PersonRole; // 'professor' o 'student'
  gymId?: string; // Gym al que pertenece (si es profesor o alumno)
  professorId?: string; // Si es alumno, su profesor asignado
}

// Gimnasio
export interface Gym {
  id: string;
  name: string;
  adminId: string;
  createdAt: Date;
  address?: string;
  phone?: string;
}

// Ejercicio
export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscleGroups: string[];
  videoUrl?: string;
  gymId?: string; // Si es null, es ejercicio global del sistema
  createdAt: Date;
}

// Serie de un ejercicio
export interface ExerciseSet {
  id: string;
  repetitions?: number;
  loadPercentage?: number; // % de carga
  weight?: number; // kg
  rir?: number; // RIR (Reps in Reserve)
  restTime?: number; // tiempo de descanso en segundos
  completed?: boolean;
  notes?: string;
}

// Ejercicio en una rutina
export interface RoutineExercise {
  id: string;
  exerciseId: string;
  exercise?: Exercise;
  sets: ExerciseSet[];
  order: number;
}

// Día de rutina
export interface RoutineDay {
  id: string;
  dayNumber: number;
  name?: string;
  exercises: RoutineExercise[];
}

// Rutina
export interface Routine {
  id: string;
  name: string;
  description?: string;
  professorId: string;
  gymId?: string;
  days: RoutineDay[];
  isTemplate: boolean; // Si es una plantilla o una rutina asignada
  createdAt: Date;
  updatedAt: Date;
}

// Rutina asignada a un alumno
export interface AssignedRoutine extends Routine {
  studentId: string;
  assignedAt: Date;
  startDate?: Date;
  currentDay?: number;
  status: 'active' | 'completed' | 'paused';
}

// Comentario durante entrenamiento
export interface WorkoutComment {
  id: string;
  routineId: string;
  exerciseId: string;
  userId: string;
  comment: string;
  createdAt: Date;
}

// Máximo personal de un usuario
export interface PersonalMax {
  id: string;
  userId: string;
  exerciseId: string;
  maxWeight: number;
  maxReps?: number;
  updatedAt: Date;
}

// Solicitud entre gym y persona
export interface GymRequest {
  id: string;
  userId: string; // ID de la persona
  gymId: string;
  requestedRole: PersonRole; // 'professor' o 'student'
  requestType: RequestType; // 'gym_to_person' o 'person_to_gym'
  status: RequestStatus;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Quién revisó (userId o gymId)
  message?: string; // Mensaje opcional
}

// Mensaje entre alumno y profesor
export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  routineId?: string; // Opcional, si está relacionado con una rutina
  message: string;
  createdAt: Date;
  read: boolean;
}
