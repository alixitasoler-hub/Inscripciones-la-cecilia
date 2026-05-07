-- Migración para corregir columnas faltantes y añadir nuevos campos laborales
-- Nota: Si las columnas ya existen, estas sentencias pueden fallar, lo cual es normal si la DB ya estaba parcialmente actualizada.

-- Corregir columna faltante reportada
ALTER TABLE padres_tutores ADD COLUMN direccion TEXT;

-- Añadir nuevo campo para ubicación laboral
ALTER TABLE padres_tutores ADD COLUMN direccion_laboral TEXT;
