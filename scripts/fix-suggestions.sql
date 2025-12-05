-- PASO 1: Encuentra tu proceso
-- Ejecuta esto primero para ver tus procesos recientes
SELECT id, name, created_at 
FROM processes 
ORDER BY created_at DESC 
LIMIT 10;

-- PASO 2: Copia el ID del proceso que quieres arreglar y reemplázalo abajo
-- Luego ejecuta estas queries (una por una o todas juntas):

-- Reemplaza 'AQUI_TU_PROCESS_ID' con el ID real
DO $$
DECLARE
  process_id_var UUID := 'AQUI_TU_PROCESS_ID'; -- CAMBIA ESTO
BEGIN
  -- Borrar improvements
  DELETE FROM improvement_suggestions 
  WHERE process_id = process_id_var;
  
  -- Borrar automations
  DELETE FROM automation_suggestions 
  WHERE step_id IN (
    SELECT id FROM steps WHERE process_id = process_id_var
  );
  
  -- Resetear health metrics
  UPDATE processes 
  SET health_score = NULL, health_summary = NULL 
  WHERE id = process_id_var;
  
  RAISE NOTICE 'Sugerencias borradas exitosamente para el proceso %', process_id_var;
END $$;

-- PASO 3: Verifica que se borraron
SELECT 
  (SELECT COUNT(*) FROM improvement_suggestions WHERE process_id = 'AQUI_TU_PROCESS_ID') as improvements_count,
  (SELECT COUNT(*) FROM automation_suggestions WHERE step_id IN (SELECT id FROM steps WHERE process_id = 'AQUI_TU_PROCESS_ID')) as automations_count,
  (SELECT health_score FROM processes WHERE id = 'AQUI_TU_PROCESS_ID') as health_score;
