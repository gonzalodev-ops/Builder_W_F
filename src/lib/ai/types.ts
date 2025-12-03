export type Locale = 'es-MX' | 'es-ES' | 'en'

// Entrada/salida para parseo de SOP
export interface ParsedStep {
  name: string
  role_hint: string | null
  notes: string | null
}

export interface ParseSopParams {
  sopText: string
  locale?: Locale
  processSummary?: {
    name: string
    objective: string
    type: string
    trigger: string
  }
}

// Sugerencias de entregables
export type DeliverableType = 'documento' | 'archivo' | 'registro' | 'correo' | 'otro'
export type DeliverableRecipient = 'cliente' | 'interno' | 'archivo'

export interface DeliverableSuggestion {
  step_id: string
  name: string
  type: DeliverableType
  recipient: DeliverableRecipient
  reason: string
}

export interface SuggestDeliverablesParams {
  processSummary: {
    name: string
    objective: string
    type: string
  }
  steps: Array<{
    id: string
    name: string
    role_name: string | null
  }>
  existingDeliverables: Array<{
    step_id: string
    name: string
    type: DeliverableType
    recipient: DeliverableRecipient
  }>
}

// Sugerencias de KPIs
export type MetricType = 'tiempo' | 'porcentaje' | 'cantidad' | 'otro'

export interface KpiSuggestion {
  name: string
  description: string
  metric_type: MetricType
  example_target: string
}

export interface SuggestKpisParams {
  processSummary: {
    name: string
    objective: string
    type: string
  }
  deliverables: Array<{
    name: string
    type: DeliverableType
    recipient: DeliverableRecipient
  }>
  existingKpis: Array<{
    name: string
  }>
}

// Sugerencias de mejoras y automatización
export type ImprovementType = 'simplificar' | 'agregar' | 'reordenar' | 'clarificar'

export type AutomationType =
  | 'notificacion'
  | 'integracion'
  | 'documento'
  | 'archivo'
  | 'formulario'

export interface ImprovementSuggestionAI {
  type: ImprovementType
  description: string
  affected_step_ids: string[]
}

export interface AutomationSuggestionAI {
  step_id: string
  automation_type: AutomationType
  description: string
}

export interface SuggestImprovementsParams {
  processSummary: {
    name: string
    objective: string
    type: string
  }
  steps: Array<{
    id: string
    name: string
    role_name: string | null
    position: number
  }>
  roles: Array<{
    id: string
    name: string
  }>
  deliverables: Array<{
    step_id: string
    name: string
    recipient: DeliverableRecipient
  }>
  kpis: Array<{
    name: string
    target_value: string | null
  }>
}

// Interfaz de proveedor de IA
export interface AiProvider {
  parseSopToSteps(params: ParseSopParams): Promise<ParsedStep[]>

  suggestDeliverables(
    params: SuggestDeliverablesParams,
  ): Promise<DeliverableSuggestion[]>

  suggestKpis(params: SuggestKpisParams): Promise<KpiSuggestion[]>

  suggestImprovementsAndAutomations(
    params: SuggestImprovementsParams,
  ): Promise<{
    improvements: ImprovementSuggestionAI[]
    automations: AutomationSuggestionAI[]
  }>
}


