// Tipos de TypeScript para el schema de Supabase

export interface Company {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  company_id: string | null
  full_name: string | null
  email: string
  created_at: string
  updated_at: string
}

export type ProcessStatus = 'borrador' | 'listo'
export type CaptureMethod = 'guided' | 'sop'
export type ProcessType = 'cliente' | 'interno' | 'fiscal' | 'rh' | 'operativo' | 'financiero'

export interface Process {
  id: string
  company_id: string
  created_by: string | null
  name: string
  objective: string
  type: ProcessType
  trigger: string
  status: ProcessStatus
  capture_method: CaptureMethod | null
  health_score: number | null
  health_summary: string | null
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  company_id: string | null
  name: string
  is_predefined: boolean
  created_at: string
}

export interface Step {
  id: string
  process_id: string
  role_id: string | null
  name: string
  description: string | null
  position: number
  sla_duration: number | null
  created_at: string
  updated_at: string
}

export type DeliverableType = 'documento' | 'archivo' | 'registro' | 'correo' | 'otro'
export type DeliverableRecipient = 'cliente' | 'interno' | 'archivo'

export interface Deliverable {
  id: string
  step_id: string
  name: string
  type: DeliverableType
  recipient: DeliverableRecipient
  description: string | null
  created_at: string
  updated_at: string
}

export type MetricType = 'tiempo' | 'porcentaje' | 'cantidad' | 'otro'

export interface KPI {
  id: string
  process_id: string
  name: string
  description: string | null
  metric_type: MetricType | null
  is_active: boolean
  target_value: string | null
  created_at: string
  updated_at: string
}

export type ImprovementType = 'simplificar' | 'agregar' | 'reordenar' | 'clarificar' | 'eliminar_redundancia'
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'applied'

export interface ImprovementSuggestion {
  id: string
  process_id: string
  type: ImprovementType
  description: string
  affected_steps: string[]
  status: SuggestionStatus
  created_at: string
  updated_at: string
}

export type AutomationType = 'notificacion' | 'integracion' | 'documento' | 'archivo' | 'formulario'

export interface AutomationSuggestion {
  id: string
  step_id: string
  automation_type: AutomationType
  description: string | null
  status: SuggestionStatus
  created_at: string
  updated_at: string
}

// DTOs y tipos de formulario
export interface CreateProcessData {
  name: string
  objective: string
  type: ProcessType
  trigger: string
}

export interface CreateStepData {
  name: string
  role_id?: string
  description?: string
  position: number
}

export interface CreateDeliverableData {
  name: string
  type: DeliverableType
  recipient: DeliverableRecipient
  description?: string
}

