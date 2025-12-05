-- Migration: Cleanup incomplete suggestions and add constraints
-- This ensures all suggestions have the required fields

-- Step 1: Delete incomplete improvement suggestions (missing title)
DELETE FROM improvement_suggestions 
WHERE title IS NULL OR title = '';

-- Step 2: Delete incomplete automation suggestions (missing title or priority_level)
DELETE FROM automation_suggestions 
WHERE title IS NULL OR title = '' OR priority_level IS NULL;

-- Step 3: Reset health_score for processes with deleted suggestions
UPDATE processes 
SET health_score = NULL, health_summary = NULL
WHERE id IN (
  SELECT DISTINCT process_id 
  FROM processes p
  WHERE NOT EXISTS (
    SELECT 1 FROM improvement_suggestions 
    WHERE process_id = p.id
  )
  AND p.health_score IS NOT NULL
);

-- Step 4: Add NOT NULL constraints to ensure data quality going forward
-- (We'll make title required for better UX)
ALTER TABLE improvement_suggestions 
  ALTER COLUMN title SET NOT NULL;

ALTER TABLE automation_suggestions 
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN priority_level SET NOT NULL;

-- Step 5: Add check constraints for priority_level values
ALTER TABLE automation_suggestions 
  ADD CONSTRAINT automation_suggestions_priority_level_check 
  CHECK (priority_level IN ('QUICK_WIN', 'EFFICIENCY_PROJECT'));

-- Step 6: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_improvement_suggestions_process_id 
  ON improvement_suggestions(process_id);

CREATE INDEX IF NOT EXISTS idx_automation_suggestions_step_id 
  ON automation_suggestions(step_id);

CREATE INDEX IF NOT EXISTS idx_automation_suggestions_priority_level 
  ON automation_suggestions(priority_level);

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Incomplete suggestions cleaned up and constraints added';
END $$;
