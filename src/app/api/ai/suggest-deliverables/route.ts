import { NextResponse } from 'next/server'
import { initializeAiProvider } from '@/lib/ai/init'
import { generateDeliverableSuggestions } from '@/lib/ai/usecases/suggestDeliverables'
import type { SuggestDeliverablesParams } from '@/lib/ai/types'

export async function POST(request: Request) {
  try {
    initializeAiProvider()
    
    const body: SuggestDeliverablesParams = await request.json()
    
    const suggestions = await generateDeliverableSuggestions(body)
    
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error al generar sugerencias de entregables:', error)
    return NextResponse.json(
      { error: 'Error al generar sugerencias de entregables' },
      { status: 500 }
    )
  }
}
