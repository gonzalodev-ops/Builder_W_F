/**
 * Parser de SOP (Standard Operating Procedure)
 * Analiza texto libre y extrae pasos de proceso
 */

interface ParsedStep {
  name: string
  role: string
}

// Verbos comunes que indican acciones/pasos
const ACTION_VERBS = [
  'entregar', 'entrego', 'entrega',
  'enviar', 'envío', 'envía', 'enviarle', 'enviarle',
  'recibir', 'recibo', 'recibe',
  'validar', 'valido', 'valida',
  'verificar', 'verifico', 'verifica',
  'aprobar', 'apruebo', 'aprueba', 'aprobación',
  'revisar', 'reviso', 'revisa',
  'generar', 'genero', 'genera',
  'crear', 'creo', 'crea',
  'firmar', 'firmo', 'firma', 'firmado',
  'pasar', 'paso', 'pasa',
  'atender', 'atiendo', 'atiende',
  'programar', 'programo', 'programa',
  'esperar', 'espero', 'espera',
  'contactar', 'contacto', 'contacta',
  'solicitar', 'solicito', 'solicita',
  'confirmar', 'confirmo', 'confirma',
  'notificar', 'notifico', 'notifica',
  'registrar', 'registro', 'registra',
  'archivar', 'archivo', 'archiva',
  'procesar', 'proceso', 'procesa',
  'facturar', 'facturo', 'factura', 'facturación',
  'aceptar', 'acepto', 'acepta',
  'retomar', 'retomo', 'retoma',
  'vuelvo', 'vuelve',
  'realizar', 'realizo', 'realiza',
  'ejecutar', 'ejecuto', 'ejecuta',
  'hacer', 'hago', 'hace',
]

// Patrones de verbos en forma pasiva (se + verbo)
const PASSIVE_PATTERNS = [
  'se entrega', 'se envía', 'se pasa', 'se programa',
  'se factura', 'se atiende', 'se procesa', 'se registra',
  'se valida', 'se verifica', 'se aprueba', 'se firma',
]

// Roles comunes que pueden aparecer en el texto
const COMMON_ROLES = [
  'ventas', 'cliente', 'coordinador', 'facturación', 'crédito',
  'operaciones', 'legal', 'administración', 'gerente', 'director',
  'rh', 'recursos humanos', 'contabilidad', 'finanzas', 'soporte',
  'ti', 'tecnología', 'marketing',
]

/**
 * Limpia y normaliza una oración
 */
function cleanSentence(sentence: string): string {
  return sentence
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[-•*\d.)\s]+/, '') // Quita bullets y números al inicio
}

/**
 * Detecta si una oración contiene un verbo de acción
 */
function hasActionVerb(sentence: string): boolean {
  const lowerSentence = sentence.toLowerCase()
  
  // Primero verificar patrones pasivos
  const hasPassive = PASSIVE_PATTERNS.some(pattern => 
    lowerSentence.includes(pattern)
  )
  
  if (hasPassive) return true
  
  // Luego verificar verbos de acción regulares
  return ACTION_VERBS.some(verb => {
    const regex = new RegExp(`\\b${verb}\\b`, 'i')
    return regex.test(lowerSentence)
  })
}

/**
 * Extrae el rol mencionado en la oración
 */
function extractRole(sentence: string): string {
  const lowerSentence = sentence.toLowerCase()
  
  // Buscar roles comunes
  for (const role of COMMON_ROLES) {
    const regex = new RegExp(`\\b${role}\\b`, 'i')
    if (regex.test(lowerSentence)) {
      // Capitalizar primera letra
      return role.charAt(0).toUpperCase() + role.slice(1)
    }
  }
  
  // Patrones comunes: "el X", "área de X", "departamento de X"
  const patterns = [
    /(?:el|la)\s+área\s+de\s+([a-záéíóúñ]+)/i,
    /(?:el|la)\s+departamento\s+de\s+([a-záéíóúñ]+)/i,
    /(?:el|la)\s+([a-záéíóúñ]+)\s+(?:hace|realiza|ejecuta)/i,
  ]
  
  for (const pattern of patterns) {
    const match = lowerSentence.match(pattern)
    if (match && match[1]) {
      const role = match[1]
      return role.charAt(0).toUpperCase() + role.slice(1)
    }
  }
  
  return 'Sin asignar'
}

/**
 * Acorta el nombre del paso si es muy largo
 */
function shortenStepName(name: string, maxLength: number = 80): string {
  if (name.length <= maxLength) return name
  
  // Buscar un punto de corte natural (coma, punto, "y")
  const cutPoints = [',', ' y ', '.']
  for (const cutPoint of cutPoints) {
    const index = name.indexOf(cutPoint)
    if (index > 0 && index < maxLength) {
      return name.substring(0, index).trim()
    }
  }
  
  // Si no hay punto de corte, cortar en espacio más cercano
  const lastSpace = name.substring(0, maxLength).lastIndexOf(' ')
  if (lastSpace > 0) {
    return name.substring(0, lastSpace).trim() + '...'
  }
  
  return name.substring(0, maxLength).trim() + '...'
}

/**
 * Divide el texto en oraciones relevantes
 */
function splitIntoSentences(text: string): string[] {
  // Dividir por puntos, pero conservar algunos casos especiales
  let sentences = text.split(/[.]\s+/)
  
  // También considerar saltos de línea como separadores
  sentences = sentences.flatMap(s => s.split(/\n+/))
  
  // Considerar comas y "y" como separadores en algunos casos
  // Solo si la oración resultante sigue siendo larga
  const expandedSentences: string[] = []
  for (const sentence of sentences) {
    // Si la oración es muy larga (>150 chars) y tiene "y" o ",", dividir
    if (sentence.length > 150) {
      // Dividir por " y " o ", "
      const parts = sentence.split(/(?:\s+y\s+|,\s+)(?=entonces|luego|después|finalmente|cuando|si)/i)
      expandedSentences.push(...parts)
    } else {
      expandedSentences.push(sentence)
    }
  }
  
  return expandedSentences
    .map(s => cleanSentence(s))
    .filter(s => s.length > 10) // Filtrar oraciones muy cortas
}

/**
 * Parser principal de SOP
 */
export function parseSOP(sopText: string): ParsedStep[] {
  if (!sopText || sopText.trim().length < 20) {
    return []
  }

  const sentences = splitIntoSentences(sopText)
  const steps: ParsedStep[] = []
  
  for (const sentence of sentences) {
    // Solo considerar oraciones que tengan un verbo de acción
    if (hasActionVerb(sentence)) {
      const role = extractRole(sentence)
      const stepName = shortenStepName(sentence)
      
      // Evitar duplicados muy similares (pero permitir variaciones)
      const isDuplicate = steps.some(step => {
        const similarity = step.name.toLowerCase().substring(0, 20)
        const current = stepName.toLowerCase().substring(0, 20)
        return similarity === current
      })
      
      if (!isDuplicate && stepName.length > 5) {
        steps.push({
          name: stepName,
          role: role,
        })
      }
    }
  }
  
  // Si se detectaron muy pocos pasos, intentar una estrategia alternativa
  // Buscar oraciones que empiecen con números o bullets
  if (steps.length < 3) {
    const numberedSteps = sopText.match(/(?:^|\n)\s*\d+[.)]\s*([^\n]+)/g)
    if (numberedSteps && numberedSteps.length > 0) {
      return numberedSteps.map(step => {
        const cleaned = cleanSentence(step)
        return {
          name: shortenStepName(cleaned),
          role: extractRole(cleaned),
        }
      })
    }
  }
  
  return steps
}

/**
 * Valida que los pasos detectados tengan sentido
 */
export function validateSteps(steps: ParsedStep[]): {
  valid: boolean
  message?: string
} {
  if (steps.length === 0) {
    return {
      valid: false,
      message: 'No se detectaron pasos. Revisa que el texto contenga acciones específicas.',
    }
  }
  
  if (steps.length < 3) {
    return {
      valid: false,
      message: 'Se detectaron muy pocos pasos. Asegúrate de describir el proceso completo.',
    }
  }
  
  if (steps.length > 50) {
    return {
      valid: false,
      message: 'Se detectaron demasiados pasos. Considera simplificar el proceso.',
    }
  }
  
  return { valid: true }
}

