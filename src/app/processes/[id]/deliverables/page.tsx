'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import StageProgressBar from '@/components/StageProgressBar'
import PageTransition from '@/components/ui/PageTransition'
import { supabase } from '@/lib/supabase/client'
import type { Step, Deliverable } from '@/types/database'
import { DELIVERABLE_TYPES, DELIVERABLE_RECIPIENTS } from '@/lib/constants/processTypes'

interface DeliverableWithStep extends Deliverable {
  step?: Step
}

export default function DeliverablesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [steps, setSteps] = useState<Step[]>([])
  const [deliverables, setDeliverables] = useState<DeliverableWithStep[]>([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [newDeliverable, setNewDeliverable] = useState({
    step_id: '',
    name: '',
    type: 'documento' as const,
    recipient: 'cliente' as const,
    description: '',
  })

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      // Cargar pasos
      const { data: stepsData, error: stepsError } = await supabase
        .from('steps')
        .select('*')
        .eq('process_id', params.id)
        .order('position')

      if (stepsError) throw stepsError
      setSteps(stepsData || [])

      // Cargar entregables
      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('deliverables')
        .select('*')
        .in('step_id', (stepsData || []).map(s => s.id))

      if (deliverablesError) throw deliverablesError
      
      // Asociar entregables con sus pasos
      const deliverablesWithSteps = (deliverablesData || []).map(d => ({
        ...d,
        step: stepsData?.find(s => s.id === d.step_id)
      }))
      
      setDeliverables(deliverablesWithSteps)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDeliverable = async () => {
    if (!newDeliverable.step_id || !newDeliverable.name) return

    try {
      const { data, error } = await supabase
        .from('deliverables')
        .insert([newDeliverable])
        .select()
        .single()

      if (error) throw error

      // Agregar a la lista local
      const step = steps.find(s => s.id === newDeliverable.step_id)
      setDeliverables([...deliverables, { ...data, step }])

      // Resetear formulario
      setNewDeliverable({
        step_id: '',
        name: '',
        type: 'documento',
        recipient: 'cliente',
        description: '',
      })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error al agregar entregable:', error)
      alert('Error al agregar entregable')
    }
  }

  const handleDeleteDeliverable = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deliverables')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDeliverables(deliverables.filter(d => d.id !== id))
    } catch (error) {
      console.error('Error al eliminar entregable:', error)
    }
  }

  const handleGenerateAISuggestions = async () => {
    setAiLoading(true)
    try {
      const { data: process } = await supabase
        .from('processes')
        .select('name, objective, type')
        .eq('id', params.id)
        .single()

      const { data: roles } = await supabase.from('roles').select('*')
      const rolesMap: Record<string, string> = {}
      roles?.forEach(r => { rolesMap[r.id] = r.name })

      const stepsForAI = steps.map(s => ({
        id: s.id,
        name: s.name,
        role_name: s.role_id ? rolesMap[s.role_id] : null
      }))

      const existingDeliverablesForAI = deliverables.map(d => ({
        step_id: d.step_id,
        name: d.name,
        type: d.type,
        recipient: d.recipient
      }))

      const { data, error } = await supabase.functions.invoke('ai-gemini', {
        body: {
          use_case: 'suggest_deliverables',
          payload: {
            processSummary: {
              name: process?.name || '',
              objective: process?.objective || '',
              type: process?.type || ''
            },
            steps: stepsForAI,
            existingDeliverables: existingDeliverablesForAI
          }
        }
      })

      if (error) throw error
      setAiSuggestions(data?.suggestions || [])
    } catch (error) {
      console.error('Error al generar sugerencias:', error)
      alert('Error al generar sugerencias con IA')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAcceptSuggestion = async (suggestion: any) => {
    try {
      const { data, error } = await supabase
        .from('deliverables')
        .insert([{
          step_id: suggestion.step_id,
          name: suggestion.name,
          type: suggestion.type,
          recipient: suggestion.recipient,
          description: suggestion.reason
        }])
        .select()
        .single()

      if (error) throw error

      const step = steps.find(s => s.id === suggestion.step_id)
      setDeliverables([...deliverables, { ...data, step }])
      setAiSuggestions(aiSuggestions.filter(s => s !== suggestion))
    } catch (error) {
      console.error('Error al aceptar sugerencia:', error)
      alert('Error al agregar entregable')
    }
  }

  const hasClientDeliverables = deliverables.some(d => d.recipient === 'cliente')
  const hasInternalDeliverables = deliverables.some(d => d.recipient === 'interno')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando entregables...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StageProgressBar processId={params.id} />
      
      <PageTransition className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Paso 3 de 5</span>
            <span>→</span>
            <span>Entregables</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Entregables</h1>
          <p className="mt-2 text-gray-600">
            Objetivo: hacer explícito qué produce el flujo y quién recibe qué
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Panel principal - Tabla de entregables */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">
                    Entregables del proceso ({deliverables.length})
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerateAISuggestions}
                      disabled={aiLoading || steps.length === 0}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {aiLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Analizando...</span>
                        </>
                      ) : (
                        <>
                          <span>🤖</span>
                          <span>Sugerir con IA</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      + Agregar manual
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  Define entregables solo en los pasos que realmente producen algo útil para el cliente o para otra área.
                </p>
              </div>

              {/* Sugerencias de IA */}
              {aiSuggestions.length > 0 && (
                <div className="p-6 bg-purple-50 border-b border-purple-100">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <span>🤖</span>
                    <span>Sugerencias de IA ({aiSuggestions.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {aiSuggestions.map((suggestion, index) => {
                      const step = steps.find(s => s.id === suggestion.step_id)
                      return (
                        <div key={index} className="bg-white p-4 rounded-lg border border-purple-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{suggestion.name}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                Paso: {step?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-600 mt-2">{suggestion.reason}</div>
                              <div className="flex gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  suggestion.recipient === 'cliente' ? 'bg-blue-100 text-blue-700' :
                                  suggestion.recipient === 'interno' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {suggestion.recipient}
                                </span>
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                  {suggestion.type}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptSuggestion(suggestion)}
                                className="text-sm px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                              >
                                Aceptar
                              </button>
                              <button
                                onClick={() => setAiSuggestions(aiSuggestions.filter(s => s !== suggestion))}
                                className="text-sm px-3 py-1 text-gray-600 hover:text-gray-800"
                              >
                                Ignorar
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Formulario de agregar */}
              {showAddForm && (
                <div className="p-6 bg-blue-50 border-b border-blue-100">
                  <h3 className="font-medium mb-4">Nuevo entregable</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paso asociado *
                      </label>
                      <select
                        value={newDeliverable.step_id}
                        onChange={(e) => setNewDeliverable({ ...newDeliverable, step_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Selecciona un paso</option>
                        {steps.map((step, index) => (
                          <option key={step.id} value={step.id}>
                            {index + 1}. {step.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del entregable *
                      </label>
                      <input
                        type="text"
                        value={newDeliverable.name}
                        onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
                        placeholder="Ej: Reporte mensual, Contrato firmado, Factura..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo
                      </label>
                      <select
                        value={newDeliverable.type}
                        onChange={(e) => setNewDeliverable({ ...newDeliverable, type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {DELIVERABLE_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destinatario
                      </label>
                      <select
                        value={newDeliverable.recipient}
                        onChange={(e) => setNewDeliverable({ ...newDeliverable, recipient: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {DELIVERABLE_RECIPIENTS.map(recipient => (
                          <option key={recipient.value} value={recipient.value}>
                            {recipient.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 flex gap-3">
                      <button
                        onClick={handleAddDeliverable}
                        disabled={!newDeliverable.step_id || !newDeliverable.name}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de entregables */}
              <div className="overflow-x-auto">
                {deliverables.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <p className="text-lg mb-2">No hay entregables definidos aún</p>
                    <p className="text-sm">Agrega entregables para documentar qué produce cada paso</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Paso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Entregable
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Destinatario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <AnimatePresence>
                        {deliverables.map((deliverable) => (
                          <motion.tr 
                            key={deliverable.id} 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {deliverable.step?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {deliverable.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {DELIVERABLE_TYPES.find(t => t.value === deliverable.type)?.label}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                                deliverable.recipient === 'cliente' ? 'bg-blue-100 text-blue-800' :
                                deliverable.recipient === 'interno' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {DELIVERABLE_RECIPIENTS.find(r => r.value === deliverable.recipient)?.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => handleDeleteDeliverable(deliverable.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Eliminar
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Panel derecho - Checklist */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="font-semibold mb-4">Checklist</h3>
              <div className="space-y-3 text-sm">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={hasClientDeliverables}
                    readOnly
                    className="mt-1"
                  />
                  <span className="text-gray-700">
                    Los entregables al cliente están definidos
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={hasInternalDeliverables}
                    readOnly
                    className="mt-1"
                  />
                  <span className="text-gray-700">
                    Los entregables internos importantes están definidos
                  </span>
                </label>
              </div>

              {hasClientDeliverables && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Mínimo cumplido</span>
                  </div>
                  <button
                    onClick={() => router.push(`/processes/${params.id}/kpis`)}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Continuar a KPIs ▶
                  </button>
                </div>
              )}

              {deliverables.length > 0 && !hasClientDeliverables && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-orange-600">
                    ⚠️ Define al menos un entregable para el cliente antes de continuar
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  )
}

