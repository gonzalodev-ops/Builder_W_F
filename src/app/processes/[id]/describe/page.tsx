'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import StageProgressBar from '@/components/StageProgressBar'
import PageTransition from '@/components/ui/PageTransition'
import AnimatedButton from '@/components/ui/AnimatedButton'
import { supabase } from '@/lib/supabase/client'

export default function DescribePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [method, setMethod] = useState<'guided' | 'sop' | null>(null)
  const [sopText, setSopText] = useState('')
  const [steps, setSteps] = useState<Array<{ name: string; role: string }>>([])
  const [loading, setLoading] = useState(false)

  const handleDetectSteps = async () => {
    if (!sopText.trim()) return

    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase/client')
      
      // Obtener información del proceso para contexto
      const { data: process } = await supabase
        .from('processes')
        .select('name, objective, type, trigger')
        .eq('id', params.id)
        .single()
      
      // Llamar a la Edge Function de IA
      console.log('🤖 Llamando a ai-gemini con:', { 
        sopText: sopText.substring(0, 100) + '...', 
        process 
      })
      
      const { data, error } = await supabase.functions.invoke('ai-gemini', {
        body: {
          use_case: 'parse_sop',
          payload: {
            sopText,
            processSummary: process ? {
              name: process.name,
              objective: process.objective,
              type: process.type,
              trigger: process.trigger
            } : undefined
          }
        }
      })
      
      console.log('🤖 Respuesta de ai-gemini:', { data, error })
      
      if (error) {
        console.error('❌ Error de Edge Function:', error)
        console.error('❌ Detalles del error:', JSON.stringify(error, null, 2))
        console.error('❌ Data recibida:', data)
        alert(`Error de IA: ${error.message || JSON.stringify(error)}\n\nDetalles: ${JSON.stringify(data)}`)
        throw error
      }
      
      if (!data?.steps || data.steps.length === 0) {
        alert('No se detectaron pasos en el texto. Asegúrate de describir acciones específicas.')
        return
      }
      
      // Convertir el formato de la IA al formato esperado
      const detected = data.steps.map((step: any) => ({
        name: step.name,
        role: step.role_hint || ''
      }))
      
      setSteps(detected)
    } catch (error) {
      console.error('Error al detectar pasos con IA:', error)
      // Fallback al parser local si falla la IA
      try {
        const { parseSOP } = require('@/lib/utils/sopParser')
        const detected = parseSOP(sopText)
        
        if (detected.length === 0) {
          alert('No se detectaron pasos en el texto. Asegúrate de describir acciones específicas.')
          return
        }
        
        setSteps(detected)
      } catch (fallbackError) {
        alert('Error al detectar pasos. Por favor intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateFlow = async () => {
    if (steps.length === 0) return
    
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase/client')
      
      // Primero, eliminar pasos existentes de este proceso
      await supabase
        .from('steps')
        .delete()
        .eq('process_id', params.id)
      
      // Luego, insertar los nuevos pasos con sus posiciones
      const stepsToInsert = steps.map((step, index) => ({
        process_id: params.id,
        name: step.name,
        position: index,
        role_id: null, // Por ahora sin rol, lo asignaremos en la etapa de Flujo
      }))
      
      const { error } = await supabase
        .from('steps')
        .insert(stepsToInsert)
      
      if (error) throw error
      
      // Actualizar el método de captura en el proceso
      await supabase
        .from('processes')
        .update({ capture_method: method || 'sop' })
        .eq('id', params.id)
      
      // Redirigir al flujo
      router.push(`/processes/${params.id}/flow`)
    } catch (error) {
      console.error('Error al guardar pasos:', error)
      alert('Error al guardar los pasos. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StageProgressBar processId={params.id} />
      
      <PageTransition className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Paso 1 de 5</span>
            <span>→</span>
            <span>Describir</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Describir el proceso</h1>
          <p className="mt-2 text-gray-600">
            Objetivo: obtener una lista de pasos razonable de cómo se trabaja hoy
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Method Selection */}
            {!method && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">¿Cómo quieres describir tu proceso?</h2>
                <p className="text-gray-600 mb-6">
                  Elige un método de captura. Solo podrás usar uno por proceso.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMethod('guided')}
                    className="border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="text-2xl mb-2">🗣️</div>
                    <h3 className="font-semibold text-lg mb-2">Preguntas guiadas</h3>
                    <p className="text-sm text-gray-600">
                      Te hago preguntas y voy armando los pasos
                    </p>
                  </button>

                  <button
                    onClick={() => setMethod('sop')}
                    className="border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="text-2xl mb-2">📄</div>
                    <h3 className="font-semibold text-lg mb-2">Pegar procedimiento (SOP)</h3>
                    <p className="text-sm text-gray-600">
                      Pegas tu texto y yo detecto los pasos
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Guided Questions */}
            {method === 'guided' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Preguntas guiadas</h2>
                <div className="space-y-4">
                  <p className="text-gray-600">🚧 Próximamente: Wizard de preguntas guiadas</p>
                </div>
              </div>
            )}

            {/* SOP Method */}
            {method === 'sop' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Pegar procedimiento (SOP)</h2>
                <p className="text-gray-600 mb-4">
                  Pega aquí tu procedimiento existente. Detectaremos los pasos automáticamente.
                </p>
                
                <textarea
                  value={sopText}
                  onChange={(e) => setSopText(e.target.value)}
                  placeholder="Ejemplo:&#10;1. Recibir solicitud del cliente&#10;2. Validar información...&#10;3. Enviar confirmación..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />

                <div className="mt-4 flex gap-3">
                  <AnimatedButton
                    onClick={handleDetectSteps}
                    disabled={!sopText || loading}
                    isLoading={loading}
                    loadingText="Analizando con IA..."
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <>
                      <span>🤖</span>
                      <span>Detectar pasos con IA</span>
                    </>
                  </AnimatedButton>
                  
                  {steps.length > 0 && (
                    <AnimatedButton
                      onClick={() => setSteps([])}
                      variant="outline"
                    >
                      Limpiar
                    </AnimatedButton>
                  )}
                </div>

                {/* Detected Steps */}
                {steps.length > 0 && (
                  <div className="mt-6 border-t pt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">
                        Pasos detectados: {steps.length}
                      </h3>
                      <button
                        onClick={() => {
                          const newSteps = [...steps, { name: '', role: '' }]
                          setSteps(newSteps)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Agregar paso manualmente
                      </button>
                    </div>
                    
                    {/* Encabezados de columna */}
                    <div className="grid grid-cols-12 gap-3 px-3 pb-2 text-sm font-medium text-gray-600">
                      <div className="col-span-1">#</div>
                      <div className="col-span-5">Nombre del paso</div>
                      <div className="col-span-5">Rol responsable</div>
                      <div className="col-span-1 text-center">Acciones</div>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      <AnimatePresence>
                        {steps.map((step, index) => (
                          <motion.div 
                            key={index} 
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded overflow-hidden"
                          >
                            <div className="col-span-1">
                              <span className="font-semibold text-gray-500">{index + 1}.</span>
                            </div>
                            <div className="col-span-5">
                              <input
                                type="text"
                                value={step.name}
                                onChange={(e) => {
                                  const newSteps = [...steps]
                                  newSteps[index].name = e.target.value
                                  setSteps(newSteps)
                                }}
                                placeholder="Nombre del paso"
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              />
                            </div>
                            <div className="col-span-5">
                              <input
                                type="text"
                                value={step.role}
                                onChange={(e) => {
                                  const newSteps = [...steps]
                                  newSteps[index].role = e.target.value
                                  setSteps(newSteps)
                                }}
                                placeholder="Rol responsable"
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              />
                            </div>
                            <div className="col-span-1 text-center">
                              <button
                                onClick={() => {
                                  const newSteps = steps.filter((_, i) => i !== index)
                                  setSteps(newSteps)
                                }}
                                className="text-red-600 hover:text-red-700 px-2"
                                title="Eliminar paso"
                              >
                                ✕
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Checklist */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="font-semibold mb-4">Checklist</h3>
              <div className="space-y-3 text-sm">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={steps.length >= 3}
                    readOnly
                    className="mt-1"
                  />
                  <span className="text-gray-700">
                    Tengo al menos 3 pasos
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={steps.length > 0}
                    readOnly
                    className="mt-1"
                  />
                  <span className="text-gray-700">
                    La secuencia tiene sentido
                  </span>
                </label>
              </div>

              {steps.length >= 3 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">¡Listo para continuar!</span>
                  </div>
                  <AnimatedButton
                    onClick={handleGenerateFlow}
                    disabled={loading}
                    isLoading={loading}
                    loadingText="Guardando..."
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Se ve bien, generar mi flujo ▶
                  </AnimatedButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  )
}

