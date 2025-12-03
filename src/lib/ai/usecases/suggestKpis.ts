import { getAiProvider } from '../provider'
import type { KpiSuggestion, SuggestKpisParams } from '../types'

export async function generateKpiSuggestions(
  params: SuggestKpisParams,
): Promise<KpiSuggestion[]> {
  const ai = getAiProvider()
  return ai.suggestKpis(params)
}


