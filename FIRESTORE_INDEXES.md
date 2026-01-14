# Índices de Firestore

Firestore requiere índices compuestos para ciertas queries. Los errores que aparecen incluyen enlaces directos para crear los índices necesarios.

## Índices Requeridos

### 1. Rutinas por Profesor
**Colección:** `routines`
**Campos:**
- `professorId` (Ascending)
- `createdAt` (Descending)

**Nota:** Ya se corrigió el código para ordenar en memoria, pero si quieres mejor rendimiento, puedes crear este índice.

### 2. Rutinas Asignadas por Alumno
**Colección:** `assignedRoutines`
**Campos:**
- `studentId` (Ascending)
- `status` (Ascending)
- `assignedAt` (Descending)

**Nota:** Ya se corrigió el código para ordenar en memoria, pero si quieres mejor rendimiento, puedes crear este índice.

## Crear Índices Automáticamente

Cuando veas un error de índice, Firebase te dará un enlace directo. Simplemente haz clic en el enlace y se creará automáticamente.

O puedes crearlos manualmente en [Firebase Console](https://console.firebase.google.com/project/coachmeapp-b5b1a/firestore/indexes)

## Solución Temporal

El código ya está ajustado para ordenar en memoria en lugar de usar `orderBy` en las queries, lo que evita la necesidad de índices compuestos. Esto funciona bien para pequeñas y medianas cantidades de datos.
