// Tipos de procesos disponibles

export const PROCESS_TYPES = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'interno', label: 'Interno' },
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'rh', label: 'Recursos Humanos' },
  { value: 'operativo', label: 'Operativo' },
  { value: 'financiero', label: 'Financiero' },
] as const

export const DELIVERABLE_TYPES = [
  { value: 'documento', label: 'Documento' },
  { value: 'archivo', label: 'Archivo' },
  { value: 'registro', label: 'Registro en sistema' },
  { value: 'correo', label: 'Correo' },
  { value: 'otro', label: 'Otro' },
] as const

export const DELIVERABLE_RECIPIENTS = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'interno', label: 'Interno' },
  { value: 'archivo', label: 'Archivo' },
] as const

export const METRIC_TYPES = [
  { value: 'tiempo', label: 'Tiempo' },
  { value: 'porcentaje', label: 'Porcentaje' },
  { value: 'cantidad', label: 'Cantidad' },
  { value: 'otro', label: 'Otro' },
] as const

export const AUTOMATION_TYPES = [
  { value: 'notificacion', label: 'Notificación / Recordatorio' },
  { value: 'integracion', label: 'Integración entre sistemas' },
  { value: 'documento', label: 'Generación de documento' },
  { value: 'archivo', label: 'Movimiento o archivo de documentos' },
  { value: 'formulario', label: 'Formularios / Captura de datos' },
] as const

