import { getAiProvider } from '../provider'
import type { ParseSopParams, ParsedStep } from '../types'

export async function generateStepsFromSop(params: ParseSopParams): Promise<ParsedStep[]> {
  const ai = getAiProvider()
  return ai.parseSopToSteps(params)
}


