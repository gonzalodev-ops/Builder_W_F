'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import StageProgressBar from '@/components/StageProgressBar'
import PageTransition from '@/components/ui/PageTransition'
import AnimatedButton from '@/components/ui/AnimatedButton'
import { supabase } from '@/lib/supabase/client'
import type { KPI, Process } from '@/types/database'
import { logAppEvent } from '@/lib/analytics/logEvent'
import { METRIC_TYPES } from '@/lib/constants/processTypes'

// KPIs sugeridos según tipo de proceso
const SUGGESTED_KPIS: Record<string, Array<{ name: string; description: string; metric_type: string }>> = {
  cliente: [
    { name: 'Tiempo de ciclo', description: 'Tiempo desde inicio hasta entrega final', metric_type: 'tiempo' },
    { name: '% de entregas a tiempo', description: 'Porcentaje de casos entregados en la fecha comprometida', metric_type: 'porcentaje' },
    { name: 'Satisfacción del cliente', description: 'Calificación promedio del cliente', metric_type: 'porcentaje' },
    { name: '% de casos sin retrabajo', description: 'Porcentaje de casos que se completan a la primera', metric_type: 'porcentaje' },
  ],
  interno: [
    { name: 'Tiempo de procesamiento', description: 'Tiempo promedio para completar el proceso', metric_type: 'tiempo' },
    { name: '% de cumplimiento', description: 'Porcentaje de casos completados vs iniciados', metric_type: 'porcentaje' },
    { name: 'Casos procesados por periodo', description: 'Número de casos atendidos por mes', metric_type: 'cantidad' },
  ],
  fiscal: [
    { name: 'Tiempo de cumplimiento', description: 'Tiempo para cumplir obligación fiscal', metric_type: 'tiempo' },
    { name: '% de entregas antes de vencimiento', description: 'Porcentaje de obligaciones cumplidas a tiempo', metric_type: 'porcentaje' },
    { name: 'Casos procesados', description: 'Número de obligaciones fiscales atendidas', metric_type: 'cantidad' },
  ],
  rh: [
    { name: 'Tiempo de onboarding', description: 'Días desde inicio hasta empleado productivo', metric_type: 'tiempo' },
    { name: '% de retención', description: 'Porcentaje de empleados que permanecen', metric_type: 'porcentaje' },
    { name: 'Satisfacción del empleado', description: 'Calificación promedio del proceso', metric_type: 'porcentaje' },
  ],
  operativo: [
    { name: 'Tiempo de operación', description: 'Tiempo promedio de ejecución', metric_type: 'tiempo' },
    { name: '% de eficiencia', description: 'Porcentaje de operaciones exitosas', metric_type: 'porcentaje' },
    { name: 'Volumen procesado', description: 'Cantidad de operaciones por periodo', metric_type: 'cantidad' },
  ],
  financiero: [
    { name: 'Tiempo de procesamiento', description: 'Días para completar transacción', metric_type: 'tiempo' },
    { name: '% de exactitud', description: 'Porcentaje de transacciones sin errores', metric_type: 'porcentaje' },
    { name: 'Monto procesado', description: 'Valor total procesado por periodo', metric_type: 'cantidad' },
  ],
}

export default function KPIsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [process, setProcess] = useState<Process | null>(null)
  const [kpis, setKpis] = useState<KPI[]>([])
  const [suggestedKpis, setSuggestedKpis] = useState<Array<{ name: string; description: string; metric_type: string }>>([])
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [editingKpiSuggestionId, setEditingKpiSuggestionId] = useState<string | null>(null)
  const [editedKpiSuggestionValues, setEditedKpiSuggestionValues] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const [editingKpi, setEditingKpi] = useState<string | null>(null)
  const [editedTarget, setEditedTarget] = useState('')

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      // Cargar proceso
      const { data: processData, error: processError } = await supabase
        .from('processes')
        .select('*')
        .eq('id', params.id)
        .single()

      if (processError) throw processError
      setProcess(processData)

      // Cargar KPIs existentes
      const { data: kpisData, error: kpisError } = await supabase
        .from('kpis')
        .select('*')
        .eq('process_id', params.id)

      if (kpisError) throw kpisError
      setKpis(kpisData || [])

      // Si no hay KPIs, mostrar sugerencias según tipo de proceso
      if (!kpisData || kpisData.length === 0) {
        const suggestions = SUGGESTED_KPIS[processData.type] || SUGGESTED_KPIS.interno
        setSuggestedKpis(suggestions)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddKpi = async (suggestion: { name: string; description: string; metric_type: string }) => {
    try {
      const { data, error } = await supabase
        .from('kpis')
        .insert([{
          process_id: params.id,
          name: suggestion.name,
          description: suggestion.description,
          metric_type: suggestion.metric_type,
          is_active: false,
          target_value: null,
        }])
        .select()
        .single()

      if (error) throw error

      setKpis([...kpis, data])
      setSuggestedKpis(suggestedKpis.filter(s => s.name !== suggestion.name))

      logAppEvent({
        eventType: 'kpi_created_from_list',
        processId: params.id,
        metadata: { 
          name: suggestion.name,
          metric_type: suggestion.metric_type 
        }
      })
    } catch (error) {
      console.error('Error al agregar KPI:', error)
    }
  }

  const handleToggleActive = async (kpiId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('kpis')
        .update({ is_active: isActive })
        .eq('id', kpiId)

      if (error) throw error

      setKpis(kpis.map(k => k.id === kpiId ? { ...k, is_active: isActive } : k))
    } catch (error) {
      console.error('Error al actualizar KPI:', error)
    }
  }

  const handleUpdateTarget = async (kpiId: string) => {
    try {
      const { error } = await supabase
        .from('kpis')
        .update({ target_value: editedTarget })
        .eq('id', kpiId)

      if (error) throw error

      setKpis(kpis.map(k => k.id === kpiId ? { ...k, target_value: editedTarget } : k))
      setEditingKpi(null)
      setEditedTarget('')
    } catch (error) {
      console.error('Error al actualizar meta:', error)
    }
  }

  const handleDeleteKpi = async (kpiId: string) => {
    try {
      const { error } = await supabase
        .from('kpis')
        .delete()
        .eq('id', kpiId)

      if (error) throw error

      const deletedKpi = kpis.find(k => k.id === kpiId)
      setKpis(kpis.filter(k => k.id !== kpiId))
      
      // Devolver a sugerencias si era una sugerencia original
      if (deletedKpi && SUGGESTED_KPIS[process?.type || 'interno']?.some(s => s.name === deletedKpi.name)) {
        const originalSuggestion = SUGGESTED_KPIS[process?.type || 'interno'].find(s => s.name === deletedKpi.name)
        if (originalSuggestion) {
          setSuggestedKpis([...suggestedKpis, originalSuggestion])
        }
      }
    } catch (error) {
      console.error('Error al eliminar KPI:', error)
    }
  }

  const handleGenerateAISuggestions = async () => {
    setAiLoading(true)
    try {
      // Obtener entregables del proceso
      const { data: steps } = await supabase
        .from('steps')
        .select('*')
        .eq('process_id', params.id)

      const stepIds = steps?.map(s => s.id) || []
      
      const { data: deliverables } = await supabase
        .from('deliverables')
        .select('*')
        .in('step_id', stepIds)

      const deliverablesForAI = (deliverables || []).map(d => ({
        name: d.name,
        type: d.type,
        recipient: d.recipient
      }))

      const existingKpisForAI = kpis.map(k => ({ name: k.name }))

      const { data, error } = await supabase.functions.invoke('ai-gemini', {
        body: {
          use_case: 'suggest_kpis',
          payload: {
            processSummary: {
              name: process?.name || '',
              objective: process?.objective || '',
              type: process?.type || ''
            },
            deliverables: deliverablesForAI,
            existingKpis: existingKpisForAI
          }
        }
      })

      if (error) throw error
      setAiSuggestions((data?.suggestions || []).map((s: any) => ({ ...s, id: crypto.randomUUID() })))
    } catch (error) {
      console.error('Error al generar sugerencias:', error)
      alert('Error al generar sugerencias con IA')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAcceptAISuggestion = async (suggestion: any) => {
    try {
      const { data, error } = await supabase
        .from('kpis')
        .insert([{
          process_id: params.id,
          name: suggestion.name,
          description: suggestion.description,
          metric_type: suggestion.metric_type,
          is_active: false,
          target_value: suggestion.example_target || null,
        }])
        .select()
        .single()

      if (error) throw error

      setKpis([...kpis, data])
      setAiSuggestions(aiSuggestions.filter(s => s.id !== suggestion.id))

      logAppEvent({
        eventType: 'kpi_suggestion_accepted',
        processId: params.id,
        metadata: { 
          name: suggestion.name, 
          metric_type: suggestion.metric_type,
          has_target: !!suggestion.example_target
        }
      })
    } catch (error) {
      console.error('Error al aceptar sugerencia:', error)
      alert('Error al agregar KPI')
    }
  }

  const handleEditKpiSuggestion = (suggestion: any) => {
    setEditingKpiSuggestionId(suggestion.id)
    setEditedKpiSuggestionValues({
      name: suggestion.name,
      description: suggestion.description,
      metric_type: suggestion.metric_type,
      example_target: suggestion.example_target || ''
    })

    logAppEvent({
      eventType: 'kpi_suggestion_edit_started',
      processId: params.id,
      metadata: { suggestion_id: suggestion.id }
    })
  }

  const handleCancelEditKpi = () => {
    setEditingKpiSuggestionId(null)
    setEditedKpiSuggestionValues(null)
    logAppEvent({
      eventType: 'kpi_suggestion_edit_cancelled',
      processId: params.id
    })
  }

  const handleSaveEditedKpiSuggestion = async (originalSuggestion: any) => {
    try {
      const { data, error } = await supabase
        .from('kpis')
        .insert([{
          process_id: params.id,
          name: editedKpiSuggestionValues.name,
          description: editedKpiSuggestionValues.description,
          metric_type: editedKpiSuggestionValues.metric_type,
          is_active: false,
          target_value: editedKpiSuggestionValues.example_target || null,
        }])
        .select()
        .single()

      if (error) throw error

      setKpis([...kpis, data])
      setAiSuggestions(aiSuggestions.filter(s => s.id !== originalSuggestion.id))
      setEditingKpiSuggestionId(null)
      setEditedKpiSuggestionValues(null)

      // Calculate changes
      const changes: Record<string, any> = {}
      if (originalSuggestion.name !== editedKpiSuggestionValues.name) changes.name_changed = true
      if (originalSuggestion.description !== editedKpiSuggestionValues.description) changes.description_changed = true
      if (originalSuggestion.metric_type !== editedKpiSuggestionValues.metric_type) changes.metric_type_changed = true
      if (originalSuggestion.example_target !== editedKpiSuggestionValues.example_target) changes.target_changed = true

      logAppEvent({
        eventType: 'kpi_suggestion_edited_and_accepted',
        processId: params.id,
        metadata: {
          changes,
          original: {
            name: originalSuggestion.name,
            metric_type: originalSuggestion.metric_type,
            target: originalSuggestion.example_target
          },
          final: {
            name: editedKpiSuggestionValues.name,
            metric_type: editedKpiSuggestionValues.metric_type,
            target: editedKpiSuggestionValues.example_target
          }
        }
      })
    } catch (error) {
      console.error('Error al guardar KPI editado:', error)
      alert('Error al agregar KPI')
    }
  }

  const activeKpis = kpis.filter(k => k.is_active)
  const hasActiveKpis = activeKpis.length > 0
  const allActiveHaveTargets = activeKpis.every(k => k.target_value && k.target_value.trim() !== '')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando KPIs...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StageProgressBar processId={params.id} />
      
      <PageTransition className="max-w-[95%] xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Paso 4 de 5</span>
              <span>→</span>
              <span>KPIs</span>
            </div>
            <button
              onClick={() => router.push('/processes')}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline flex items-center gap-1"
            >
              ← Volver a procesos
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">KPIs del proceso</h1>
          <p className="mt-2 text-gray-600">
            Objetivo: definir pocas métricas que sí vas a usar
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Panel principal */}
          <div className="col-span-2 space-y-6">
            {/* Botón para generar sugerencias con IA */}
            {kpis.length === 0 && aiSuggestions.length === 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">¿Necesitas ayuda para definir KPIs?</h3>
                    <p className="text-sm text-gray-600">La IA puede analizar tu proceso y sugerir KPIs relevantes</p>
                  </div>
                  <button
                    onClick={handleGenerateAISuggestions}
                    disabled={aiLoading}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
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
                        <span>Generar con IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Sugerencias de IA */}
            {aiSuggestions.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <span>🤖</span>
                  <span>KPIs sugeridos por IA ({aiSuggestions.length})</span>
                </h2>
                <div className="space-y-3">
                  {aiSuggestions.map((suggestion, index) => {
                    const isEditing = editingKpiSuggestionId === suggestion.id

                    if (isEditing) {
                      return (
                        <div key={suggestion.id || index} className="bg-white rounded-lg p-4 border border-purple-300 shadow-sm">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del KPI</label>
                              <input
                                type="text"
                                value={editedKpiSuggestionValues.name}
                                onChange={(e) => setEditedKpiSuggestionValues({ ...editedKpiSuggestionValues, name: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                              <textarea
                                value={editedKpiSuggestionValues.description}
                                onChange={(e) => setEditedKpiSuggestionValues({ ...editedKpiSuggestionValues, description: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                rows={2}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Métrica</label>
                                <select
                                  value={editedKpiSuggestionValues.metric_type}
                                  onChange={(e) => setEditedKpiSuggestionValues({ ...editedKpiSuggestionValues, metric_type: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  {METRIC_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Meta Sugerida (Opcional)</label>
                                <input
                                  type="text"
                                  value={editedKpiSuggestionValues.example_target}
                                  onChange={(e) => setEditedKpiSuggestionValues({ ...editedKpiSuggestionValues, example_target: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="Ej: < 24h"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                              <button
                                onClick={handleCancelEditKpi}
                                className="text-xs px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveEditedKpiSuggestion(suggestion)}
                                className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                              >
                                Guardar y Agregar
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={suggestion.id || index} className="bg-white rounded-lg p-4 flex justify-between items-start border border-purple-200">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{suggestion.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="inline-block px-2 py-1 bg-purple-100 rounded text-xs text-purple-700">
                              {suggestion.metric_type}
                            </span>
                            {suggestion.example_target && (
                              <span className="inline-block px-2 py-1 bg-green-100 rounded text-xs text-green-700">
                                Meta sugerida: {suggestion.example_target}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => handleAcceptAISuggestion(suggestion)}
                            className="bg-purple-600 text-white px-4 py-1 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors whitespace-nowrap"
                          >
                            Agregar
                          </button>
                          <button
                            onClick={() => handleEditKpiSuggestion(suggestion)}
                            className="bg-white border border-purple-300 text-purple-700 px-4 py-1 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors whitespace-nowrap"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setAiSuggestions(aiSuggestions.filter(s => s.id !== suggestion.id))}
                            className="text-sm px-3 py-1 text-gray-600 hover:text-gray-800 whitespace-nowrap"
                          >
                            Ignorar
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sugerencias estáticas de KPIs */}
            {suggestedKpis.length > 0 && aiSuggestions.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">
                  💡 KPIs sugeridos para procesos de tipo "{process?.type}"
                </h2>
                <div className="space-y-3">
                  {suggestedKpis.map((suggestion, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{suggestion.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                          {suggestion.metric_type}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddKpi(suggestion)}
                        className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KPIs agregados */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">
                  KPIs del proceso ({kpis.length})
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Activa solo los KPIs que realmente vas a medir y define sus metas
                </p>
              </div>

              {kpis.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p className="text-lg mb-2">No has agregado KPIs aún</p>
                  <p className="text-sm">Usa las sugerencias de arriba o continúa sin KPIs</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {kpis.map((kpi) => (
                      <motion.div 
                        key={kpi.id} 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-6"
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={kpi.is_active}
                            onChange={(e) => handleToggleActive(kpi.id, e.target.checked)}
                            className="mt-1 w-5 h-5 text-blue-600 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900">{kpi.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">{kpi.description}</p>
                                <span className="inline-block mt-2 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                  {kpi.metric_type}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteKpi(kpi.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Eliminar
                              </button>
                            </div>

                            {kpi.is_active && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4"
                              >
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Meta:
                                </label>
                                {editingKpi === kpi.id ? (
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={editedTarget}
                                      onChange={(e) => setEditedTarget(e.target.value)}
                                      placeholder="Ej: < 24 horas, 95%, 100 casos/mes"
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleUpdateTarget(kpi.id)}
                                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingKpi(null)
                                        setEditedTarget('')
                                      }}
                                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <div 
                                    onClick={() => {
                                      setEditingKpi(kpi.id)
                                      setEditedTarget(kpi.target_value || '')
                                    }}
                                    className="cursor-pointer"
                                  >
                                    {kpi.target_value ? (
                                      <span className="inline-block px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                                        🎯 {kpi.target_value}
                                      </span>
                                    ) : (
                                      <span className="inline-block px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                                        ⚠️ Click para definir meta
                                      </span>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
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
                    checked={hasActiveKpis}
                    readOnly
                    className="mt-1"
                  />
                  <span className="text-gray-700">
                    Hay al menos 1 KPI activo
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={allActiveHaveTargets}
                    readOnly
                    className="mt-1"
                  />
                  <span className="text-gray-700">
                    Cada KPI activo tiene una meta definida
                  </span>
                </label>
              </div>

              {hasActiveKpis && allActiveHaveTargets && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">¡KPIs listos!</span>
                  </div>
                  <AnimatedButton
                    onClick={() => {
                      setNavigating(true)
                      router.push(`/processes/${params.id}/summary`)
                    }}
                    disabled={navigating}
                    isLoading={navigating}
                    loadingText="Continuando..."
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Continuar a mejoras y resumen ▶
                  </AnimatedButton>
                </div>
              )}

              {kpis.length > 0 && (!hasActiveKpis || !allActiveHaveTargets) && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-orange-600">
                    {!hasActiveKpis && '⚠️ Activa al menos un KPI'}
                    {hasActiveKpis && !allActiveHaveTargets && '⚠️ Define metas para los KPIs activos'}
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

