/**
 * Motor de sugerencias para mejoras y automatización
 * Basado en reglas simples para el MVP
 */

import type { Step, Process } from '@/types/database'

export interface ImprovementSuggestion {
  type: 'simplificar' | 'agregar' | 'reordenar' | 'clarificar'
  description: string
  affectedSteps: string[]
}

export interface AutomationSuggestion {
  stepId: string
  stepName: string
  automationType: 'notificacion' | 'integracion' | 'documento' | 'archivo' | 'formulario'
  description: string
}

// Palabras clave para detectar automatización
const AUTOMATION_PATTERNS = {
  notificacion: ['notificar', 'avisar', 'recordar', 'alertar', 'enviar correo'],
  integracion: ['pasar a', 'enviar a', 'cargar en', 'registrar en', 'actualizar'],
  documento: ['generar', 'crear documento', 'emitir', 'factura', 'reporte', 'contrato'],
  archivo: ['archivar', 'guardar', 'almacenar', 'subir archivo'],
  formulario: ['capturar', 'solicitar información', 'llenar', 'formulario', 'recabar datos'],
}

/**
 * Analiza los pasos y sugiere mejoras del proceso
 */
export function generateImprovementSuggestions(steps: Step[]): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = []

  // 1. Detectar pasos redundantes (nombres muy similares)
  for (let i = 0; i < steps.length; i++) {
    for (let j = i + 1; j < steps.length; j++) {
      const step1 = steps[i]
      const step2 = steps[j]
      const similarity = calculateSimilarity(step1.name, step2.name)
      
      if (similarity > 0.7) {
        suggestions.push({
          type: 'simplificar',
          description: `Los pasos "${step1.name}" y "${step2.name}" parecen redundantes. Considera combinarlos en uno solo.`,
          affectedSteps: [step1.id, step2.id],
        })
      }
    }
  }

  // 2. Detectar muchos pasos con el mismo rol (posible cuello de botella)
  const roleStepCount: Record<string, string[]> = {}
  steps.forEach(step => {
    if (step.role_id) {
      if (!roleStepCount[step.role_id]) {
        roleStepCount[step.role_id] = []
      }
      roleStepCount[step.role_id].push(step.id)
    }
  })

  Object.entries(roleStepCount).forEach(([roleId, stepIds]) => {
    if (stepIds.length > 5) {
      suggestions.push({
        type: 'clarificar',
        description: `Un rol tiene asignados ${stepIds.length} pasos. Esto podría ser un cuello de botella. Considera distribuir responsabilidades.`,
        affectedSteps: stepIds,
      })
    }
  })

  // 3. Detectar faltantes típicos según palabras clave
  const hasValidation = steps.some(s => 
    s.name.toLowerCase().includes('validar') || 
    s.name.toLowerCase().includes('verificar') ||
    s.name.toLowerCase().includes('revisar')
  )
  
  if (!hasValidation && steps.length > 3) {
    suggestions.push({
      type: 'agregar',
      description: 'No se detectó un paso de validación o verificación. Considera agregar uno para asegurar la calidad.',
      affectedSteps: [],
    })
  }

  const hasApproval = steps.some(s => 
    s.name.toLowerCase().includes('aprobar') || 
    s.name.toLowerCase().includes('autorizar')
  )
  
  if (!hasApproval && steps.length > 5) {
    suggestions.push({
      type: 'agregar',
      description: 'No se detectó un paso de aprobación. Si el proceso lo requiere, considera agregarlo.',
      affectedSteps: [],
    })
  }

  return suggestions
}

/**
 * Analiza los pasos y sugiere automatizaciones
 */
export function generateAutomationSuggestions(steps: Step[]): AutomationSuggestion[] {
  const suggestions: AutomationSuggestion[] = []

  steps.forEach(step => {
    const lowerName = step.name.toLowerCase()

    // Detectar tipo de automatización por palabras clave
    for (const [type, patterns] of Object.entries(AUTOMATION_PATTERNS)) {
      for (const pattern of patterns) {
        if (lowerName.includes(pattern)) {
          suggestions.push({
            stepId: step.id,
            stepName: step.name,
            automationType: type as any,
            description: getAutomationDescription(type as any),
          })
          break // Solo una sugerencia por paso
        }
      }
      if (suggestions.some(s => s.stepId === step.id)) break
    }
  })

  return suggestions
}

/**
 * Calcula similitud entre dos strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase())
  return (longer.length - editDistance) / longer.length
}

/**
 * Calcula distancia de Levenshtein
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Descripción de cada tipo de automatización
 */
function getAutomationDescription(type: string): string {
  const descriptions: Record<string, string> = {
    notificacion: 'Automatizar notificaciones o recordatorios por email/SMS',
    integracion: 'Integrar con otro sistema para transferir datos automáticamente',
    documento: 'Generar documentos automáticamente desde plantillas',
    archivo: 'Automatizar el almacenamiento y organización de archivos',
    formulario: 'Usar formularios digitales para captura automática de datos',
  }
  return descriptions[type] || 'Automatización sugerida'
}

