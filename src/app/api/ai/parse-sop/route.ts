import { NextResponse } from 'next/server'
import { initializeAiProvider } from '@/lib/ai/init'
import { generateStepsFromSop } from '@/lib/ai/usecases/parseSop'
import type { ParseSopParams } from '@/lib/ai/types'

export async function POST(request: Request) {
  try {
    initializeAiProvider()
    
    const body: ParseSopParams = await request.json()
    
    if (!body.sopText || body.sopText.trim().length === 0) {
      return NextResponse.json(
        { error: 'El texto del SOP es requerido' },
        { status: 400 }
      )
    }
    
    const steps = await generateStepsFromSop(body)
    
    return NextResponse.json({ steps })
  } catch (error) {
    console.error('Error al parsear SOP con IA:', error)
    return NextResponse.json(
      { error: 'Error al procesar el SOP con IA' },
      { status: 500 }
    )
  }
}
