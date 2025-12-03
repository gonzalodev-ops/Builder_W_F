import type { AiProvider } from './types'

let provider: AiProvider | null = null

export function setAiProvider(p: AiProvider) {
  provider = p
}

export function getAiProvider(): AiProvider {
  if (!provider) {
    throw new Error('AI provider not configured')
  }
  return provider
}


