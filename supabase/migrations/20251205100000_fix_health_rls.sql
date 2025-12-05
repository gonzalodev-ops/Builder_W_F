-- Enable users to update health metrics on their processes
CREATE POLICY "Users can update health metrics on their processes"
ON processes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure policies exist for suggestion tables (if not already covered loosely, explicit is better)
-- Dropping existing restrictive policies if any to ensure broad write access for own processes is simple
DROP POLICY IF EXISTS "Users can insert improvement suggestions for their company" ON improvement_suggestions;
CREATE POLICY "Users can insert improvement suggestions for their company"
ON improvement_suggestions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM processes 
    WHERE processes.id = improvement_suggestions.process_id 
    AND processes.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update improvement suggestions for their company" ON improvement_suggestions;
CREATE POLICY "Users can update improvement suggestions for their company"
ON improvement_suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM processes 
    WHERE processes.id = improvement_suggestions.process_id 
    AND processes.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete improvement suggestions for their company" ON improvement_suggestions;
CREATE POLICY "Users can delete improvement suggestions for their company"
ON improvement_suggestions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM processes 
    WHERE processes.id = improvement_suggestions.process_id 
    AND processes.user_id = auth.uid()
  )
);

-- Automation suggestions usually link to steps, so we check step -> process -> user
DROP POLICY IF EXISTS "Users can insert automation suggestions for their company" ON automation_suggestions;
CREATE POLICY "Users can insert automation suggestions for their company"
ON automation_suggestions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM steps
    JOIN processes ON steps.process_id = processes.id
    WHERE steps.id = automation_suggestions.step_id
    AND processes.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update automation suggestions for their company" ON automation_suggestions;
CREATE POLICY "Users can update automation suggestions for their company"
ON automation_suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM steps
    JOIN processes ON steps.process_id = processes.id
    WHERE steps.id = automation_suggestions.step_id
    AND processes.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete automation suggestions for their company" ON automation_suggestions;
CREATE POLICY "Users can delete automation suggestions for their company"
ON automation_suggestions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM steps
    JOIN processes ON steps.process_id = processes.id
    WHERE steps.id = automation_suggestions.step_id
    AND processes.user_id = auth.uid()
  )
);
