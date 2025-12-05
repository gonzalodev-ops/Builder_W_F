-- Script para borrar las sugerencias de un proceso específico
-- Esto forzará a que la IA las regenere

-- Primero, encuentra el ID de tu proceso
-- SELECT id, name FROM processes WHERE name LIKE '%tu_proceso%';

-- Luego, reemplaza 'TU_PROCESS_ID' con el ID real y ejecuta:

-- Borrar improvements
DELETE FROM improvement_suggestions 
WHERE process_id = 'TU_PROCESS_ID';

-- Borrar automations (necesitamos los step_ids primero)
DELETE FROM automation_suggestions 
WHERE step_id IN (
  SELECT id FROM steps WHERE process_id = 'TU_PROCESS_ID'
);

-- También resetear el health_score
UPDATE processes 
SET health_score = NULL, health_summary = NULL 
WHERE id = 'TU_PROCESS_ID';
