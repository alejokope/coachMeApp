// Utilidad para crear datos de prueba
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine, Exercise } from '../types';

export const createTestData = async (studentId: string) => {
  try {
    // Obtener ejercicios existentes
    const exercisesStorage = await AsyncStorage.getItem('@coachMe:exercises');
    let exercises: Exercise[] = [];
    
    if (exercisesStorage) {
      exercises = JSON.parse(exercisesStorage);
    }

    if (exercises.length === 0) {
      return; // No hay ejercicios para crear rutina de prueba
    }

    // Crear una rutina de prueba para el alumno
    const testRoutine: any = {
      id: `test-routine-${Date.now()}`,
      name: 'Rutina de Prueba - Fuerza',
      description: 'Rutina de prueba para desarrollo',
      professorId: 'test-professor',
      studentId: studentId,
      isTemplate: false,
      status: 'active',
      currentDay: 1,
      assignedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      days: [
        {
          id: 'day-1',
          dayNumber: 1,
          name: 'Día 1 - Tren Superior',
          exercises: [
            {
              id: 'ex-1',
              exerciseId: exercises[0]?.id || '1',
              exercise: exercises[0],
              order: 1,
              sets: [
                { id: 'set-1', repetitions: 10, weight: 60, restTime: 90 },
                { id: 'set-2', repetitions: 10, weight: 60, restTime: 90 },
                { id: 'set-3', repetitions: 8, weight: 65, restTime: 90 },
              ],
            },
            {
              id: 'ex-2',
              exerciseId: exercises[1]?.id || '2',
              exercise: exercises[1],
              order: 2,
              sets: [
                { id: 'set-4', repetitions: 12, weight: 0, restTime: 60 },
                { id: 'set-5', repetitions: 12, weight: 0, restTime: 60 },
                { id: 'set-6', repetitions: 10, weight: 0, restTime: 60 },
              ],
            },
          ],
        },
        {
          id: 'day-2',
          dayNumber: 2,
          name: 'Día 2 - Tren Inferior',
          exercises: [
            {
              id: 'ex-3',
              exerciseId: exercises[2]?.id || '3',
              exercise: exercises[2],
              order: 1,
              sets: [
                { id: 'set-7', repetitions: 8, weight: 100, restTime: 120 },
                { id: 'set-8', repetitions: 8, weight: 100, restTime: 120 },
                { id: 'set-9', repetitions: 6, weight: 110, restTime: 120 },
              ],
            },
          ],
        },
      ],
    };

    // Guardar rutina
    const routinesStorage = await AsyncStorage.getItem('@coachMe:routines');
    const routines = routinesStorage ? JSON.parse(routinesStorage) : [];
    
    // Verificar si ya existe una rutina de prueba para este estudiante
    const existingIndex = routines.findIndex(
      (r: any) => r.studentId === studentId && r.id?.startsWith('test-routine')
    );

    if (existingIndex >= 0) {
      routines[existingIndex] = testRoutine;
    } else {
      routines.push(testRoutine);
    }

    await AsyncStorage.setItem('@coachMe:routines', JSON.stringify(routines));
  } catch (error) {
    console.error('Error creating test data:', error);
  }
};
