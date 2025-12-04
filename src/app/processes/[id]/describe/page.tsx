'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import StageProgressBar from '@/components/StageProgressBar'
import PageTransition from '@/components/ui/PageTransition'
import AnimatedButton from '@/components/ui/AnimatedButton'
import { supabase } from '@/lib/supabase/client'

import type { Role } from '@/types/database'

export default function DescribePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [method, setMethod] = useState<'guided' | 'sop' | null>(null)
  const [sopText, setSopText] = useState('')
  const [steps, setSteps] = useState<Array<{ name: string; role: string }>>([])
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    const { data } = await supabase.from('roles').select('*')
    if (data) setRoles(data)
  }

  const handleDetectSteps = async (textOverride?: string) => {
    const textToProcess = textOverride || sopText
    if (!textToProcess.trim()) return

    setLoading(true)
    try {
      // Obtener información del proceso para contexto
      const { data: process } = await supabase
        .from('processes')
        .select('name, objective, type, trigger')
        .eq('id', params.id)
        .single()
      
      // Llamar a la Edge Function de IA
      console.log('🤖 Llamando a ai-gemini con:', { 
        sopText: textToProcess.substring(0, 100) + '...', 
        process 
      })
      
      const { data, error } = await supabase.functions.invoke('ai-gemini', {
        body: {
          use_case: 'parse_sop',
          payload: {
            sopText: textToProcess,
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
        const detected = parseSOP(textToProcess)
        
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null
    
    if ('dataTransfer' in e) {
      e.preventDefault()
      file = e.dataTransfer.files[0]
    } else {
      file = e.target.files?.[0] || null
    }

    if (!file) return

    // Simulación de lectura para binarios o lectura real para texto
    if (file.type === 'text/plain' || file.name.endsWith('.md')) {
      const text = await file.text()
      setSopText(text)
      handleDetectSteps(text)
    } else {
      // Para PDF, Docx, Imagenes (simulado)
      const simulatedText = `Contenido extraído del archivo: ${file.name}\n\n(Simulación de extracción automática)\n\n1. Revisar el documento ${file.name}\n2. Validar contenido\n3. Aprobar documento`
      setSopText(simulatedText)
      handleDetectSteps(simulatedText)
    }
  }

  const handleGenerateFlow = async () => {
    if (steps.length === 0) return
    
    setLoading(true)
    try {
      // 1. Obtener company_id del proceso
      const { data: process } = await supabase
        .from('processes')
        .select('company_id')
        .eq('id', params.id)
        .single()

      if (!process) throw new Error('Proceso no encontrado')
      
      // 2. Eliminar pasos existentes de este proceso
      await supabase
        .from('steps')
        .delete()
        .eq('process_id', params.id)
      
      // 3. Gestionar roles
      const roleMap = new Map(
        roles.map(r => [r.name.toLowerCase(), r.id])
      )

      // Identificar roles nuevos en los pasos
      const uniqueRolesInSteps = Array.from(new Set(steps.map(s => s.role?.trim()).filter(Boolean))) as string[]
      const newRolesToCreate = uniqueRolesInSteps.filter(r => !roleMap.has(r.toLowerCase()))

      // Crear roles nuevos si existen
      if (newRolesToCreate.length > 0) {
        const { data: createdRoles, error: roleError } = await supabase
          .from('roles')
          .insert(newRolesToCreate.map(name => ({
            company_id: process.company_id,
            name: name,
            is_predefined: false
          })))
          .select()

        if (roleError) throw roleError
        
        if (createdRoles) {
          createdRoles.forEach(r => roleMap.set(r.name.toLowerCase(), r.id))
          setRoles(prev => [...prev, ...createdRoles])
        }
      }

      // 4. Insertar los nuevos pasos con sus posiciones y roles
      const stepsToInsert = steps.map((step, index) => {
        const roleName = step.role?.trim().toLowerCase()
        const roleId = roleName ? roleMap.get(roleName) : null

        return {
          process_id: params.id,
          name: step.name,
          position: index,
          role_id: roleId || null, 
        }
      })
      
      const { error } = await supabase
        .from('steps')
        .insert(stepsToInsert)
      
      if (error) throw error
      
      // 5. Actualizar el método de captura en el proceso
      await supabase
        .from('processes')
        .update({ capture_method: method || 'sop' })
        .eq('id', params.id)
      
      // Redirigir al flujo
      router.push(`/processes/${params.id}/flow`)
    } catch (error: any) {
      console.error('Error al guardar pasos:', error)
      alert(`Error al guardar los pasos: ${error.message || 'Intenta de nuevo'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StageProgressBar processId={params.id} />
      
      <PageTransition className="max-w-[95%] xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo del proceso</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                      placeholder="¿Qué se busca lograr?"
                      onChange={(e) => setSopText(prev => `Objetivo: ${e.target.value}\n` + prev.split('\n').slice(1).join('\n'))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pasos principales</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                      rows={5}
                      placeholder="- Paso 1..."
                      onChange={(e) => setSopText(prev => prev.split('\n')[0] + `\nPasos:\n${e.target.value}`)}
                    />
                  </div>
                  <AnimatedButton
                    onClick={() => handleDetectSteps()}
                    disabled={loading}
                    isLoading={loading}
                    className="bg-blue-600 text-white w-full"
                  >
                    Generar pasos
                  </AnimatedButton>
                </div>
              </div>
            )}

            {/* SOP Method */}
            {method === 'sop' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Cargar procedimiento (SOP)</h2>
                <p className="text-gray-600 mb-4">
                  Arrastra tu archivo o pega el texto. Detectaremos los pasos automáticamente.
                </p>
                
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileUpload}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <input 
                    type="file" 
                    id="fileInput" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
                  />
                  <div className="text-4xl mb-2">📂</div>
                  <p className="text-sm text-gray-600">Click o arrastra PDF, Word, Texto o Imagen aquí</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">O pega el texto</span>
                  </div>
                </div>

                <textarea
                  value={sopText}
                  onChange={(e) => setSopText(e.target.value)}
                  placeholder="Ejemplo:&#10;1. Recibir solicitud del cliente&#10;2. Validar información...&#10;3. Enviar confirmación..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm mt-4"
                />

                <div className="mt-4 flex gap-3">
                  <AnimatedButton
                    onClick={() => handleDetectSteps()}
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
              </div>
            )}

            {/* Detected Steps - MOVED HERE (Fix B-5) */}
            {steps.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
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
                            list="roles-list" 
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                          <datalist id="roles-list">
                            {roles.map(r => (
                              <option key={r.id} value={r.name} />
                            ))}
                          </datalist>
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
