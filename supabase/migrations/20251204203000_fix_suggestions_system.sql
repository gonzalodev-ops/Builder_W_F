-- Migration: Complete fix for suggestions system
-- 1. Enable RLS on suggestion tables
-- 2. Cleanup incomplete suggestions
-- 3. Add constraints for data quality

-- Step 1: Enable RLS on both tables
ALTER TABLE improvement_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_suggestions ENABLE ROW LEVEL SECURITY;

-- Step 2: Delete incomplete suggestions
DELETE FROM improvement_suggestions 
WHERE title IS NULL OR title = '';

DELETE FROM automation_suggestions 
WHERE title IS NULL OR title = '' OR priority_level IS NULL;

-- Step 3: Reset health_score for affected processes
UPDATE processes 
SET health_score = NULL, health_summary = NULL
WHERE id IN (
  SELECT DISTINCT p.id 
  FROM processes p
  WHERE NOT EXISTS (
    SELECT 1 FROM improvement_suggestions 
    WHERE process_id = p.id
  )
  AND p.health_score IS NOT NULL
);

-- Step 4: Make title required (but allow existing NULLs to be updated first)
-- We'll add this as a check constraint instead of NOT NULL to be less strict
ALTER TABLE improvement_suggestions 
  ADD CONSTRAINT improvement_suggestions_title_check 
  CHECK (title IS NOT NULL AND title != '');

ALTER TABLE automation_suggestions 
  ADD CONSTRAINT automation_suggestions_title_check 
  CHECK (title IS NOT NULL AND title != '');

ALTER TABLE automation_suggestions 
  ADD CONSTRAINT automation_suggestions_priority_level_check 
  CHECK (priority_level IN ('QUICK_WIN', 'EFFICIENCY_PROJECT'));

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_improvement_suggestions_process_id 
  ON improvement_suggestions(process_id);

CREATE INDEX IF NOT EXISTS idx_automation_suggestions_step_id 
  ON automation_suggestions(step_id);

CREATE INDEX IF NOT EXISTS idx_automation_suggestions_priority_level 
  ON automation_suggestions(priority_level);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully:';
  RAISE NOTICE '- RLS enabled on suggestion tables';
  RAISE NOTICE '- Incomplete suggestions cleaned up';
  RAISE NOTICE '- Constraints and indexes added';
END $$;
