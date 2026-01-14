// Script para agregar ejercicios iniciales a Firestore
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

interface ExerciseData {
  name: string;
  description: string;
  muscleGroups: string[];
  videoUrl?: string;
  gymId?: string | null;
}

const defaultExercises: ExerciseData[] = [
  // Pectorales
  {
    name: 'Press de Banca',
    description: 'Ejercicio fundamental para desarrollar el pecho, hombros y tríceps. Acostado en banco plano, bajar la barra al pecho y empujar hacia arriba.',
    muscleGroups: ['Pectorales', 'Tríceps', 'Deltoides Anterior'],
    videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  },
  {
    name: 'Press Inclinado con Mancuernas',
    description: 'Variación del press de banca en banco inclinado para enfocar la parte superior del pecho.',
    muscleGroups: ['Pectorales Superiores', 'Deltoides Anterior'],
  },
  {
    name: 'Aperturas con Mancuernas',
    description: 'Ejercicio de aislamiento para el pecho. Acostado en banco, abrir y cerrar los brazos con mancuernas.',
    muscleGroups: ['Pectorales'],
  },
  {
    name: 'Flexiones',
    description: 'Ejercicio de peso corporal para fortalecer pecho, hombros y tríceps.',
    muscleGroups: ['Pectorales', 'Tríceps', 'Deltoides'],
  },
  {
    name: 'Fondos en Paralelas',
    description: 'Ejercicio de peso corporal para pecho y tríceps. Suspender el cuerpo entre dos barras paralelas.',
    muscleGroups: ['Pectorales', 'Tríceps'],
  },

  // Espalda
  {
    name: 'Dominadas',
    description: 'Ejercicio fundamental para la espalda. Colgarse de una barra y elevar el cuerpo hasta que la barbilla pase la barra.',
    muscleGroups: ['Dorsales', 'Bíceps', 'Trapecio'],
  },
  {
    name: 'Remo con Barra',
    description: 'Ejercicio para el grosor de la espalda. Inclinado hacia adelante, tirar la barra hacia el abdomen.',
    muscleGroups: ['Dorsales', 'Romboides', 'Bíceps'],
  },
  {
    name: 'Jalones al Pecho',
    description: 'Ejercicio en máquina para desarrollar la anchura de la espalda. Tirar la barra hacia el pecho.',
    muscleGroups: ['Dorsales', 'Bíceps'],
  },
  {
    name: 'Remo con Mancuerna',
    description: 'Ejercicio unilateral para la espalda. Apoyar rodilla y mano en banco, tirar mancuerna hacia el torso.',
    muscleGroups: ['Dorsales', 'Romboides', 'Bíceps'],
  },
  {
    name: 'Peso Muerto',
    description: 'Ejercicio compuesto fundamental. Levantar barra desde el suelo manteniendo espalda recta.',
    muscleGroups: ['Espalda Baja', 'Glúteos', 'Cuádriceps', 'Trapecio'],
  },

  // Hombros
  {
    name: 'Press Militar',
    description: 'Ejercicio para hombros. De pie o sentado, empujar barra desde los hombros hacia arriba.',
    muscleGroups: ['Deltoides', 'Tríceps'],
  },
  {
    name: 'Elevaciones Laterales',
    description: 'Ejercicio de aislamiento para deltoides laterales. Elevar mancuernas a los lados hasta altura de hombros.',
    muscleGroups: ['Deltoides Lateral'],
  },
  {
    name: 'Elevaciones Frontales',
    description: 'Ejercicio para deltoides anteriores. Elevar mancuerna o barra al frente hasta altura de hombros.',
    muscleGroups: ['Deltoides Anterior'],
  },
  {
    name: 'Vuelos Laterales',
    description: 'Ejercicio de aislamiento para deltoides posteriores. Inclinado, abrir brazos con mancuernas.',
    muscleGroups: ['Deltoides Posterior'],
  },
  {
    name: 'Press Arnold',
    description: 'Variación del press de hombros con rotación. Comenzar con mancuernas frente al pecho, rotar y empujar.',
    muscleGroups: ['Deltoides', 'Tríceps'],
  },

  // Bíceps
  {
    name: 'Curl de Bíceps con Barra',
    description: 'Ejercicio fundamental para bíceps. De pie, flexionar brazos levantando barra hacia los hombros.',
    muscleGroups: ['Bíceps'],
  },
  {
    name: 'Curl de Bíceps con Mancuernas',
    description: 'Variación del curl permitiendo movimiento independiente de cada brazo.',
    muscleGroups: ['Bíceps'],
  },
  {
    name: 'Curl Martillo',
    description: 'Ejercicio para bíceps y antebrazos. Curl con mancuernas en posición neutra (agarre martillo).',
    muscleGroups: ['Bíceps', 'Antebrazos'],
  },
  {
    name: 'Curl en Banco Scott',
    description: 'Ejercicio de aislamiento para bíceps. Apoyar brazos en banco inclinado y hacer curl.',
    muscleGroups: ['Bíceps'],
  },
  {
    name: 'Curl de Concentración',
    description: 'Ejercicio de aislamiento sentado. Apoyar codo en muslo y hacer curl con una mancuerna.',
    muscleGroups: ['Bíceps'],
  },

  // Tríceps
  {
    name: 'Press Francés',
    description: 'Ejercicio de aislamiento para tríceps. Acostado, bajar barra hacia la frente flexionando codos.',
    muscleGroups: ['Tríceps'],
  },
  {
    name: 'Extensiones de Tríceps',
    description: 'Ejercicio para tríceps. De pie o sentado, extender brazos sobre la cabeza con mancuerna o polea.',
    muscleGroups: ['Tríceps'],
  },
  {
    name: 'Fondos en Banco',
    description: 'Ejercicio de peso corporal para tríceps. Apoyar manos en banco detrás del cuerpo y hacer flexiones.',
    muscleGroups: ['Tríceps', 'Deltoides Anterior'],
  },
  {
    name: 'Patada de Tríceps',
    description: 'Ejercicio de aislamiento. Inclinado, extender brazo hacia atrás con mancuerna.',
    muscleGroups: ['Tríceps'],
  },
  {
    name: 'Press de Tríceps en Polea',
    description: 'Ejercicio en máquina para tríceps. Empujar barra hacia abajo manteniendo codos fijos.',
    muscleGroups: ['Tríceps'],
  },

  // Piernas
  {
    name: 'Sentadillas',
    description: 'Ejercicio fundamental para piernas. Bajar flexionando rodillas y caderas, luego subir.',
    muscleGroups: ['Cuádriceps', 'Glúteos', 'Isquiotibiales'],
  },
  {
    name: 'Prensa de Piernas',
    description: 'Ejercicio en máquina para piernas. Empujar plataforma con las piernas.',
    muscleGroups: ['Cuádriceps', 'Glúteos'],
  },
  {
    name: 'Extensiones de Cuádriceps',
    description: 'Ejercicio de aislamiento para cuádriceps. Sentado en máquina, extender piernas.',
    muscleGroups: ['Cuádriceps'],
  },
  {
    name: 'Curl de Isquiotibiales',
    description: 'Ejercicio de aislamiento para isquiotibiales. Acostado boca abajo, flexionar piernas en máquina.',
    muscleGroups: ['Isquiotibiales'],
  },
  {
    name: 'Zancadas',
    description: 'Ejercicio unilateral para piernas. Dar paso largo hacia adelante y bajar hasta que ambas rodillas estén a 90 grados.',
    muscleGroups: ['Cuádriceps', 'Glúteos', 'Isquiotibiales'],
  },
  {
    name: 'Peso Muerto Rumano',
    description: 'Variación del peso muerto enfocada en isquiotibiales y glúteos. Mantener piernas casi rectas.',
    muscleGroups: ['Isquiotibiales', 'Glúteos', 'Espalda Baja'],
  },
  {
    name: 'Sentadilla Búlgara',
    description: 'Ejercicio unilateral. Apoyar pie trasero en banco y hacer sentadilla con pierna delantera.',
    muscleGroups: ['Cuádriceps', 'Glúteos'],
  },
  {
    name: 'Elevación de Talones',
    description: 'Ejercicio para pantorrillas. De pie, elevar talones lo más alto posible.',
    muscleGroups: ['Pantorrillas'],
  },

  // Glúteos
  {
    name: 'Hip Thrust',
    description: 'Ejercicio para glúteos. Apoyar espalda en banco, barra en cadera, y empujar cadera hacia arriba.',
    muscleGroups: ['Glúteos', 'Isquiotibiales'],
  },
  {
    name: 'Patada de Glúteo',
    description: 'Ejercicio de aislamiento para glúteos. A cuatro patas, extender pierna hacia atrás.',
    muscleGroups: ['Glúteos'],
  },
  {
    name: 'Puente de Glúteos',
    description: 'Ejercicio básico para glúteos. Acostado boca arriba, elevar cadera del suelo.',
    muscleGroups: ['Glúteos', 'Isquiotibiales'],
  },

  // Core/Abdominales
  {
    name: 'Plancha',
    description: 'Ejercicio isométrico para core. Mantener posición de flexión sin movimiento.',
    muscleGroups: ['Abdominales', 'Core'],
  },
  {
    name: 'Crunches',
    description: 'Ejercicio básico para abdominales. Acostado, elevar torso hacia las rodillas.',
    muscleGroups: ['Abdominales'],
  },
  {
    name: 'Plancha Lateral',
    description: 'Variación de plancha de lado para trabajar oblicuos.',
    muscleGroups: ['Oblicuos', 'Core'],
  },
  {
    name: 'Mountain Climbers',
    description: 'Ejercicio dinámico para core. En posición de plancha, alternar llevar rodillas al pecho.',
    muscleGroups: ['Abdominales', 'Core'],
  },
  {
    name: 'Russian Twists',
    description: 'Ejercicio para oblicuos. Sentado, rotar torso de lado a lado con peso.',
    muscleGroups: ['Oblicuos', 'Core'],
  },
  {
    name: 'Dead Bug',
    description: 'Ejercicio para core. Acostado boca arriba, alternar extender brazo y pierna opuesta.',
    muscleGroups: ['Abdominales', 'Core'],
  },

  // Cardio
  {
    name: 'Burpees',
    description: 'Ejercicio de cuerpo completo y cardio. Combinación de sentadilla, flexión y salto.',
    muscleGroups: ['Full Body', 'Cardio'],
  },
  {
    name: 'Jumping Jacks',
    description: 'Ejercicio de calentamiento y cardio. Saltar abriendo piernas y elevando brazos.',
    muscleGroups: ['Cardio'],
  },
  {
    name: 'High Knees',
    description: 'Ejercicio de cardio. Correr en el lugar elevando rodillas alto.',
    muscleGroups: ['Cardio', 'Cuádriceps'],
  },
];

export async function seedExercises() {
  try {
    const exercisesRef = collection(db, 'exercises');
    let addedCount = 0;
    let skippedCount = 0;

    for (const exercise of defaultExercises) {
      try {
        // Preparar datos sin campos undefined
        const exerciseData: any = {
          name: exercise.name,
          description: exercise.description || null,
          muscleGroups: exercise.muscleGroups,
          gymId: null, // Ejercicios globales
          createdAt: serverTimestamp(),
        };
        
        // Solo agregar videoUrl si existe y no está vacío
        if (exercise.videoUrl && exercise.videoUrl.trim()) {
          exerciseData.videoUrl = exercise.videoUrl.trim();
        }
        
        await addDoc(exercisesRef, exerciseData);
        addedCount++;
        console.log(`✓ Agregado: ${exercise.name}`);
      } catch (error) {
        console.error(`✗ Error agregando ${exercise.name}:`, error);
        skippedCount++;
      }
    }

    console.log(`\n✅ Proceso completado:`);
    console.log(`   - Ejercicios agregados: ${addedCount}`);
    console.log(`   - Ejercicios omitidos: ${skippedCount}`);
    console.log(`   - Total: ${defaultExercises.length}`);

    return { addedCount, skippedCount };
  } catch (error) {
    console.error('Error en seedExercises:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedExercises()
    .then(() => {
      console.log('✅ Seed completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en seed:', error);
      process.exit(1);
    });
}
