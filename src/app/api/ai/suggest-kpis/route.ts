import { NextResponse } from 'next/server'
import { initializeAiProvider } from '@/lib/ai/init'
import { generateKpiSuggestions } from '@/lib/ai/usecases/suggestKpis'
import type { SuggestKpisParams } from '@/lib/ai/types'

export async function POST(request: Request) {
  try {
    initializeAiProvider()
    
    const body: SuggestKpisParams = await request.json()
    
    const suggestions = await generateKpiSuggestions(body)
    
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error al generar sugerencias de KPIs:', error)
    return NextResponse.json(
      { error: 'Error al generar sugerencias de KPIs' },
      { status: 500 }
    )
  }
}
