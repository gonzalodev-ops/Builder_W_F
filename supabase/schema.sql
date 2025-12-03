-- ============================================
-- SCHEMA PARA CHISPAS - HERRAMIENTA DE WORKFLOWS
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Companies (Multi-tenant)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processes
CREATE TABLE processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    objective TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- cliente, interno, fiscal, rh, etc.
    trigger VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'borrador', -- borrador, listo
    capture_method VARCHAR(20), -- guided, sop
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles (catalog of roles)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_predefined BOOLEAN DEFAULT FALSE, -- roles del catálogo vs creados por usuario
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Steps
CREATE TABLE steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL, -- orden en el flujo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(process_id, position)
);

-- Deliverables
CREATE TABLE deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- documento, archivo, registro, correo, otro
    recipient VARCHAR(50) NOT NULL, -- cliente, interno, archivo
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPIs
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metric_type VARCHAR(50), -- tiempo, porcentaje, cantidad, etc.
    is_active BOOLEAN DEFAULT FALSE,
    target_value VARCHAR(100), -- meta como texto (ej: "< 24 horas", "95%")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Improvement Suggestions (Oportunidades de mejora del proceso)
CREATE TABLE improvement_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- simplificar, agregar, reordenar, clarificar, etc.
    description TEXT NOT NULL,
    affected_steps UUID[], -- array de step_ids
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, applied
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Suggestions (Oportunidades de automatización)
CREATE TABLE automation_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
    automation_type VARCHAR(100) NOT NULL, -- notificación, integración, documento, archivo, formulario
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_processes_company ON processes(company_id);
CREATE INDEX idx_processes_status ON processes(status);
CREATE INDEX idx_steps_process ON steps(process_id);
CREATE INDEX idx_steps_position ON steps(process_id, position);
CREATE INDEX idx_deliverables_step ON deliverables(step_id);
CREATE INDEX idx_kpis_process ON kpis(process_id);
CREATE INDEX idx_improvement_suggestions_process ON improvement_suggestions(process_id);
CREATE INDEX idx_automation_suggestions_step ON automation_suggestions(step_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see data from their company

-- Companies
CREATE POLICY "Users can view their own company"
    ON companies FOR SELECT
    USING (id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
    ));

-- User Profiles
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (id = auth.uid());

-- Processes
CREATE POLICY "Users can view processes from their company"
    ON processes FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create processes in their company"
    ON processes FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update processes from their company"
    ON processes FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete processes from their company"
    ON processes FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
    ));

-- Similar policies for other tables (roles, steps, deliverables, kpis, suggestions)
-- (abbreviated for brevity - would follow same pattern)

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON processes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON deliverables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_improvement_suggestions_updated_at BEFORE UPDATE ON improvement_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_suggestions_updated_at BEFORE UPDATE ON automation_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Predefined Roles
-- ============================================

-- These would be inserted per company or as global defaults
-- Examples:
-- INSERT INTO roles (name, is_predefined) VALUES
-- ('Ventas', true),
-- ('Coordinador', true),
-- ('Facturación', true),
-- ('Dirección', true),
-- ('Recursos Humanos', true),
-- ('Soporte', true);

-- ============================================
-- AI USAGE LOGS
-- ============================================

CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    use_case VARCHAR(50) NOT NULL,
    process_id UUID,
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

CREATE INDEX idx_ai_usage_logs_use_case ON ai_usage_logs(use_case);
CREATE INDEX idx_ai_usage_logs_process ON ai_usage_logs(process_id);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous operations on ai_usage_logs for development"
    ON ai_usage_logs FOR ALL
    USING (true)
    WITH CHECK (true);

