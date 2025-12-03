import { setAiProvider } from './provider'
import { GeminiAiProvider } from './providers/gemini'

let initialized = false

export function initializeAiProvider() {
  if (initialized) return
  
  const apiKey = process.env.GEMINI_API_KEY
  
  if (apiKey) {
    setAiProvider(new GeminiAiProvider())
    initialized = true
    console.log('✅ AI Provider (Gemini) inicializado')
  } else {
    console.warn('⚠️ GEMINI_API_KEY no configurada - funciones de IA deshabilitadas')
  }
}

