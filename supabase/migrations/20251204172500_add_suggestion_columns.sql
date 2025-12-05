-- Add missing columns to suggestions tables
-- Add missing columns to suggestions tables
ALTER TABLE improvement_suggestions ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE automation_suggestions ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE automation_suggestions ADD COLUMN IF NOT EXISTS priority_level VARCHAR(50);

-- Add RLS policies for improvement_suggestions and automation_suggestions tables

-- Improvement Suggestions Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'improvement_suggestions' 
        AND policyname = 'Users can view improvement suggestions for their company processes'
    ) THEN
        CREATE POLICY "Users can view improvement suggestions for their company processes"
            ON improvement_suggestions FOR SELECT
            USING (process_id IN (
                SELECT id FROM processes WHERE company_id IN (
                    SELECT company_id FROM user_profiles WHERE id = auth.uid()
                )
            ));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'improvement_suggestions' 
        AND policyname = 'Users can create improvement suggestions for their company processes'
    ) THEN
        CREATE POLICY "Users can create improvement suggestions for their company processes"
            ON improvement_suggestions FOR INSERT
            WITH CHECK (process_id IN (
                SELECT id FROM processes WHERE company_id IN (
                    SELECT company_id FROM user_profiles WHERE id = auth.uid()
                )
            ));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'improvement_suggestions' 
        AND policyname = 'Users can update improvement suggestions for their company processes'
    ) THEN
        CREATE POLICY "Users can update improvement suggestions for their company processes"
            ON improvement_suggestions FOR UPDATE
            USING (process_id IN (
                SELECT id FROM processes WHERE company_id IN (
                    SELECT company_id FROM user_profiles WHERE id = auth.uid()
                )
            ));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'improvement_suggestions' 
        AND policyname = 'Users can delete improvement suggestions for their company processes'
    ) THEN
        CREATE POLICY "Users can delete improvement suggestions for their company processes"
            ON improvement_suggestions FOR DELETE
            USING (process_id IN (
                SELECT id FROM processes WHERE company_id IN (
                    SELECT company_id FROM user_profiles WHERE id = auth.uid()
                )
            ));
    END IF;
END $$;

-- Automation Suggestions Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'automation_suggestions' 
        AND policyname = 'Users can view automation suggestions for their company steps'
    ) THEN
        CREATE POLICY "Users can view automation suggestions for their company steps"
            ON automation_suggestions FOR SELECT
            USING (step_id IN (
                SELECT s.id FROM steps s
                JOIN processes p ON s.process_id = p.id
                WHERE p.company_id IN (
                    SELECT company_id FROM user_profiles WHERE id = auth.uid()
                )
            ));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'automation_suggestions' 
        AND policyname = 'Users can create automation suggestions for their company steps'
    ) THEN
        CREATE POLICY "Users can create automation suggestions for their company steps"
            ON automation_suggestions FOR INSERT
            WITH CHECK (step_id IN (
                SELECT s.id FROM steps s
                JOIN processes p ON s.process_id = p.id
                WHERE p.company_id IN (
                    SELECT company_id FROM user_profiles WHERE id = auth.uid()
                )
            ));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'automation_suggestions' 
        AND policyname = 'Users can update automation suggestions for their company steps'
    ) THEN
        CREATE POLICY "Users can update automation suggestions for their company steps"
            ON automation_suggestions FOR UPDATE
            USING (step_id IN (
                SELECT s.id FROM steps s
                JOIN processes p ON s.process_id = p.id
                WHERE p.company_id IN (
                    SELECT company_id FROM user_profiles WHERE id = auth.uid()
                )
            ));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'automation_suggestions' 
        AND policyname = 'Users can delete automation suggestions for their company steps'
    ) THEN
        CREATE POLICY "Users can delete automation suggestions for their company steps"
            ON automation_suggestions FOR DELETE
            USING (step_id IN (
                SELECT s.id FROM steps s
                JOIN processes p ON s.process_id = p.id
                WHERE p.company_id IN (
                    SELECT company_id FROM user_profiles WHERE id = auth.uid()
                )
            ));
    END IF;
END $$;
