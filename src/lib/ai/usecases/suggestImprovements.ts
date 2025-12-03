import { getAiProvider } from '../provider'
import type {
  AutomationSuggestionAI,
  ImprovementSuggestionAI,
  SuggestImprovementsParams,
} from '../types'

export async function generateImprovementsAndAutomations(
  params: SuggestImprovementsParams,
): Promise<{
  improvements: ImprovementSuggestionAI[]
  automations: AutomationSuggestionAI[]
}> {
  const ai = getAiProvider()
  return ai.suggestImprovementsAndAutomations(params)
}


