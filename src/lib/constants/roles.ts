// Catálogo de roles predefinidos frecuentes

export const PREDEFINED_ROLES = [
  'Ventas',
  'Coordinador',
  'Coordinador RH',
  'Facturación',
  'Dirección',
  'Recursos Humanos',
  'Soporte',
  'Administración',
  'Contabilidad',
  'Marketing',
  'Operaciones',
  'Legal',
  'TI / Tecnología',
] as const

export type PredefinedRole = typeof PREDEFINED_ROLES[number]

