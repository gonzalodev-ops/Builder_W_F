import { getAiProvider } from '../provider'
import type {
  DeliverableSuggestion,
  SuggestDeliverablesParams,
} from '../types'

export async function generateDeliverableSuggestions(
  params: SuggestDeliverablesParams,
): Promise<DeliverableSuggestion[]> {
  const ai = getAiProvider()
  return ai.suggestDeliverables(params)
}


