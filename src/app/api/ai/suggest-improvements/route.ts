import { NextResponse } from 'next/server'
import { initializeAiProvider } from '@/lib/ai/init'
import { generateImprovementsAndAutomations } from '@/lib/ai/usecases/suggestImprovements'
import type { SuggestImprovementsParams } from '@/lib/ai/types'

export async function POST(request: Request) {
  try {
    initializeAiProvider()
    
    const body: SuggestImprovementsParams = await request.json()
    
    const result = await generateImprovementsAndAutomations(body)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error al generar sugerencias de mejoras:', error)
    return NextResponse.json(
      { error: 'Error al generar sugerencias de mejoras' },
      { status: 500 }
    )
  }
}
