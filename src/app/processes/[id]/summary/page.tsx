'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StageProgressBar from '@/components/StageProgressBar'
import PageTransition from '@/components/ui/PageTransition'
import { supabase } from '@/lib/supabase/client'
import type { Process, Step, Deliverable, KPI, Role } from '@/types/database'
import { logAppEvent } from '@/lib/analytics/logEvent'
import {
  generateImprovementSuggestions,
  generateAutomationSuggestions,
} from '@/lib/utils/suggestions'
import type {
  ImprovementSuggestion,
  AutomationSuggestion,
} from '@/lib/utils/suggestions'
import { pdf } from '@react-pdf/renderer'
import { WorkflowPackagePDF } from '@/components/WorkflowPackagePDF'
import VisualFlowMap from '@/components/process/VisualFlowMap'

// Extended types to incluir ID para edición, manteniendo compatibilidad
// con los tipos base usados en WorkflowPackagePDF
interface ImprovementWithId extends ImprovementSuggestion {
  id?: string
}

interface AutomationWithId extends AutomationSuggestion {
  id?: string
}

export default function SummaryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [process, setProcess] = useState<Process | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [improvements, setImprovements] = useState<ImprovementWithId[]>([])
  const [automations, setAutomations] = useState<AutomationWithId[]>([])
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  
  // Editing states
  const [editingImprovementId, setEditingImprovementId] = useState<string | null>(null)
  const [editImprovementText, setEditImprovementText] = useState('')
  const [editingAutomationId, setEditingAutomationId] = useState<string | null>(null)
  const [editAutomationText, setEditAutomationText] = useState('')

  // Checklist state
  const [checklist, setChecklist] = useState({
    improvements: false,
    automations: false,
    summary: false
  })

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      // Cargar proceso
      const { data: processData } = await supabase
        .from('processes')
        .select('*')
        .eq('id', params.id)
        .single()
      setProcess(processData)

      // Cargar pasos
      const { data: stepsData } = await supabase
        .from('steps')
        .select('*')
        .eq('process_id', params.id)
        .order('position')
      setSteps(stepsData || [])

      // Cargar entregables
      let deliverablesData: Deliverable[] = []
      if (stepsData && stepsData.length > 0) {
        const { data } = await supabase
          .from('deliverables')
          .select('*')
          .in('step_id', stepsData.map(s => s.id))
        deliverablesData = data || []
        setDeliverables(deliverablesData)
      }

      // Cargar KPIs
      const { data: kpisData } = await supabase
        .from('kpis')
        .select('*')
        .eq('process_id', params.id)
        .eq('is_active', true)
      setKpis(kpisData || [])

      // Cargar roles
      const { data: rolesData } = await supabase
        .from('roles')
        .select('*')
      setRoles(rolesData || [])

      // Cargar Sugerencias Persistentes
      const { data: savedImprovements } = await supabase
        .from('improvement_suggestions')
        .select('*')
        .eq('process_id', params.id)
      
      const { data: savedAutomations } = await supabase
        .from('automation_suggestions')
        .select('*')
        .in('step_id', (stepsData || []).map(s => s.id))

      if ((savedImprovements && savedImprovements.length > 0) || (savedAutomations && savedAutomations.length > 0)) {
        // Load from DB
        setImprovements(savedImprovements?.map(i => ({
          id: i.id,
          type: i.type,
          description: i.description,
          affectedSteps: i.affected_steps || []
        })) || [])

        setAutomations(savedAutomations?.map(a => ({
          id: a.id,
          stepId: a.step_id,
          stepName: stepsData?.find(s => s.id === a.step_id)?.name || 'Paso desconocido',
          automationType: a.automation_type,
          description: a.description
        })) || [])
      } else if (processData.status === 'listo') {
        // Si el proceso ya está listo y no hay sugerencias, NO llamamos a la IA.
        // Asumimos que se guardó así intencionalmente o que no se generaron.
        console.log('Proceso listo sin sugerencias guardadas. Omitiendo análisis IA.')
        setImprovements([])
        setAutomations([])
      } else {
        // Generar sugerencias con IA si no existen y NO está listo
        if (stepsData && stepsData.length > 0 && processData) {
          await generateAISuggestions(processData, stepsData, deliverablesData, kpisData || [], rolesData || [])
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const generateAISuggestions = async (
    processData: Process,
    stepsData: Step[],
    deliverablesData: Deliverable[],
    kpisData: KPI[],
    rolesData: Role[]
  ) => {
    setIsGeneratingAi(true)
    try {
      const rolesMap: Record<string, string> = {}
      rolesData.forEach(r => { rolesMap[r.id] = r.name })

      const stepsForAI = stepsData.map(s => ({
        id: s.id,
        name: s.name,
        role_name: s.role_id ? rolesMap[s.role_id] : null,
        position: s.position
      }))

      const deliverablesForAI = deliverablesData.map(d => ({
        step_id: d.step_id,
        name: d.name,
        recipient: d.recipient
      }))

      const kpisForAI = kpisData.map(k => ({
        name: k.name,
        target_value: k.target_value
      }))

      const { data, error } = await supabase.functions.invoke('ai-gemini', {
        body: {
          use_case: 'suggest_improvements',
          payload: {
            processSummary: {
              name: processData.name,
              objective: processData.objective,
              type: processData.type
            },
            steps: stepsForAI,
            roles: rolesData.map(r => ({ id: r.id, name: r.name })),
            deliverables: deliverablesForAI,
            kpis: kpisForAI
          }
        }
      })

      if (error) throw error

      // Preparar datos para inserción
      const newImprovements = (data?.improvements || []).map((imp: any) => ({
        process_id: processData.id,
        type: imp.type,
        description: imp.description,
        affected_steps: imp.affected_step_ids || [],
        status: 'pending'
      }))

      const newAutomations = (data?.automations || []).map((auto: any) => ({
        step_id: auto.step_id,
        automation_type: auto.automation_type,
        description: auto.description,
        status: 'pending'
      }))

      // Guardar en DB
      if (newImprovements.length > 0) {
        const { data: savedImps, error: impError } = await supabase
          .from('improvement_suggestions')
          .insert(newImprovements)
          .select()
        
        if (impError) console.error('Error saving improvements', impError)
        else {
           setImprovements(savedImps.map(i => ({
             id: i.id,
             type: i.type,
             description: i.description,
             affectedSteps: i.affected_steps || []
           })))
        }
      }

      if (newAutomations.length > 0) {
         const { data: savedAutos, error: autoError } = await supabase
          .from('automation_suggestions')
          .insert(newAutomations)
          .select()

        if (autoError) console.error('Error saving automations', autoError)
        else {
          setAutomations(savedAutos.map(a => ({
            id: a.id,
            stepId: a.step_id,
            stepName: stepsData.find(s => s.id === a.step_id)?.name || '',
            automationType: a.automation_type,
            description: a.description
          })))
        }
      }

    } catch (error) {
      console.error('Error al generar sugerencias con IA:', error)
      // Fallback local (no persiste, solo muestra)
      const improvementSuggestions = generateImprovementSuggestions(stepsData)
      setImprovements(improvementSuggestions.map(i => ({...i, id: crypto.randomUUID()})))

      const automationSuggestions = generateAutomationSuggestions(stepsData)
      setAutomations(automationSuggestions.map(a => ({
         id: crypto.randomUUID(),
         stepId: a.stepId,
         stepName: a.stepName,
         automationType: a.automationType,
         description: a.description
      })))
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const handleUpdateImprovement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('improvement_suggestions')
        .update({ description: editImprovementText })
        .eq('id', id)

      if (error) throw error

      setImprovements(prev => prev.map(i => i.id === id ? { ...i, description: editImprovementText } : i))
      setEditingImprovementId(null)
      
      logAppEvent({
        eventType: 'improvement_updated',
        processId: params.id,
        metadata: { improvement_id: id }
      })
    } catch (error) {
      console.error('Error updating improvement:', error)
      alert('Error al actualizar la mejora')
    }
  }

  const handleDeleteImprovement = async (id: string) => {
    if(!confirm('¿Eliminar esta sugerencia?')) return
    try {
      const { error } = await supabase
        .from('improvement_suggestions')
        .delete()
        .eq('id', id)

      if (error) throw error
      setImprovements(prev => prev.filter(i => i.id !== id))
      
      logAppEvent({
        eventType: 'improvement_deleted',
        processId: params.id,
        metadata: { improvement_id: id }
      })
    } catch (error) {
      console.error('Error deleting improvement:', error)
    }
  }

  const handleUpdateAutomation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('automation_suggestions')
        .update({ description: editAutomationText })
        .eq('id', id)

      if (error) throw error

      setAutomations(prev => prev.map(a => a.id === id ? { ...a, description: editAutomationText } : a))
      setEditingAutomationId(null)

      logAppEvent({
        eventType: 'automation_updated',
        processId: params.id,
        metadata: { automation_id: id }
      })
    } catch (error) {
      console.error('Error updating automation:', error)
      alert('Error al actualizar la automatización')
    }
  }

  const handleDeleteAutomation = async (id: string) => {
    if(!confirm('¿Eliminar esta sugerencia?')) return
    try {
      const { error } = await supabase
        .from('automation_suggestions')
        .delete()
        .eq('id', id)

      if (error) throw error
      setAutomations(prev => prev.filter(a => a.id !== id))

      logAppEvent({
        eventType: 'automation_deleted',
        processId: params.id,
        metadata: { automation_id: id }
      })
    } catch (error) {
      console.error('Error deleting automation:', error)
    }
  }

  const handleMarkAsReady = async () => {
    if (!checklist.improvements || !checklist.automations || !checklist.summary) {
      alert('Por favor completa el checklist final antes de continuar.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('processes')
        .update({ status: 'listo' })
        .eq('id', params.id)

      if (error) throw error

      logAppEvent({
        eventType: 'process_marked_ready',
        processId: params.id,
        metadata: { previous_status: 'borrador' }
      })

      alert('¡Proceso marcado como listo! ✅')
      router.push('/processes')
    } catch (error) {
      console.error('Error al marcar proceso como listo:', error)
      alert('Error al actualizar el proceso. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!process) return

    try {
      setLoading(true)
      const rolesMap: Record<string, string> = {}
      roles.forEach(role => { rolesMap[role.id] = role.name })
      const stepsMap: Record<string, string> = {}
      steps.forEach(step => { stepsMap[step.id] = step.name })

      const doc = (
        <WorkflowPackagePDF
          process={process}
          steps={steps}
          deliverables={deliverables}
          kpis={kpis}
          improvements={improvements}
          automations={automations}
          rolesMap={rolesMap}
          stepsMap={stepsMap}
        />
      )

      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `workflow-${process.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      logAppEvent({
        eventType: 'pdf_exported',
        processId: params.id,
        metadata: { 
          step_count: steps.length,
          has_improvements: improvements.length > 0,
          has_automations: automations.length > 0 
        }
      })
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      alert('Error al generar el PDF.')
    } finally {
      setLoading(false)
    }
  }

  const getStepName = (stepId: string) => steps.find(s => s.id === stepId)?.name || 'N/A'
  const getRoleName = (roleId: string | null) => roleId ? (roles.find(r => r.id === roleId)?.name || 'N/A') : 'Sin asignar'

  const getImprovementIcon = (type: string) => {
    const icons: Record<string, string> = {
      simplificar: '🔄',
      agregar: '➕',
      reordenar: '↕️',
      clarificar: '💡',
    }
    return icons[type] || '📝'
  }

  const getAutomationIcon = (type: string) => {
    const icons: Record<string, string> = {
      notificacion: '🔔',
      integracion: '🔗',
      documento: '📄',
      archivo: '📁',
      formulario: '📝',
    }
    return icons[type] || '⚡'
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {isGeneratingAi ? (
            <>
              <div className="flex items-center justify-center gap-3 mb-2">
                <svg className="animate-spin h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-lg font-medium text-gray-900">🤖 Analizando con IA...</span>
              </div>
              <p className="text-sm text-gray-600">Generando sugerencias de mejoras y automatizaciones</p>
            </>
          ) : (
             <>
              <div className="flex items-center justify-center gap-3 mb-2">
                <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-lg font-medium text-gray-900">Cargando resumen del flujo...</span>
              </div>
              <p className="text-sm text-gray-600">Recuperando información del proceso</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StageProgressBar processId={params.id} />
      
      <PageTransition className="max-w-[95%] xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Paso 5 de 5</span>
              <span>→</span>
              <span>Mejoras, Automatización y Resumen</span>
            </div>
            <button
              onClick={() => router.push('/processes')}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline flex items-center gap-1"
            >
              ← Volver a procesos
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Mejoras, Automatización y Resumen</h1>
          <p className="mt-2 text-gray-600">
            Objetivo: identificar oportunidades de mejora y cerrar el diseño del flujo
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
            <span>🤖</span>
            <span>Sugerencias generadas por IA</span>
          </div>
        </div>

        {/* Visual Flow Map */}
        {process && (
          <div className="mb-8">
            <VisualFlowMap 
              process={process}
              steps={steps}
              roles={roles}
              deliverables={deliverables}
              kpis={kpis}
              improvements={improvements as any[]}
              automations={automations as any[]}
            />
          </div>
        )}

        <div className="space-y-6">
          {/* Mejoras del proceso */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-4">
              🔧 Oportunidades de mejora del proceso ({improvements.length})
            </h2>
            
            {improvements.length === 0 ? (
              <p className="text-gray-600">
                ✅ No se detectaron oportunidades de mejora obvias.
              </p>
            ) : (
              <div className="space-y-4">
                {improvements.map((improvement, index) => (
                  <div key={improvement.id || index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getImprovementIcon(improvement.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium uppercase">
                            {improvement.type}
                          </span>
                          <div className="flex gap-2">
                            {improvement.id && editingImprovementId !== improvement.id && (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingImprovementId(improvement.id!)
                                    setEditImprovementText(improvement.description)
                                  }}
                                  className="text-gray-400 hover:text-blue-600"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button 
                                  onClick={() => handleDeleteImprovement(improvement.id!)}
                                  className="text-gray-400 hover:text-red-600"
                                  title="Eliminar"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {editingImprovementId === improvement.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editImprovementText}
                              onChange={(e) => setEditImprovementText(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm"
                              rows={3}
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingImprovementId(null)}
                                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleUpdateImprovement(improvement.id!)}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700">{improvement.description}</p>
                        )}
                        
                        {improvement.affectedSteps?.length > 0 && (
                          <div className="mt-3 text-sm text-gray-500">
                            Pasos afectados: {improvement.affectedSteps.map(id => getStepName(id)).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Automatización */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-4">
              ⚡ Oportunidades de automatización ({automations.length})
            </h2>
            
            {automations.length === 0 ? (
              <p className="text-gray-600">
                No se detectaron pasos automatizables.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {automations.map((automation, index) => (
                      <tr key={automation.id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 align-top w-1/4">
                          {automation.stepName}
                        </td>
                        <td className="px-6 py-4 text-sm align-top w-1/6">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {getAutomationIcon(automation.automationType)} {automation.automationType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 align-top">
                          {editingAutomationId === automation.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editAutomationText}
                                onChange={(e) => setEditAutomationText(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                rows={3}
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditingAutomationId(null)}
                                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleUpdateAutomation(automation.id!)}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Guardar
                                </button>
                              </div>
                            </div>
                          ) : (
                            automation.description
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm align-top w-24">
                          {automation.id && editingAutomationId !== automation.id && (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setEditingAutomationId(automation.id!)
                                  setEditAutomationText(automation.description)
                                }}
                                className="text-gray-400 hover:text-blue-600"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => handleDeleteAutomation(automation.id!)}
                                className="text-gray-400 hover:text-red-600"
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Workflow Package Preview */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-6">📦 Resumen del flujo de trabajo</h2>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 text-sm leading-relaxed">
              <p>
                El proceso <strong>{process?.name}</strong> ha sido estructurado en <strong>{steps.length} pasos</strong> con el objetivo de <strong>{process?.objective}</strong>. 
                {kpis.length > 0 
                  ? ` Se han establecido ${kpis.length} indicadores clave.` 
                  : ' No se han definido indicadores clave.'}
                {improvements.length > 0 && ` Se identificaron ${improvements.length} mejoras y ${automations.length} automatizaciones posibles.`}
              </p>
            </div>

            <div className="space-y-6 border border-gray-200 rounded-lg p-6 bg-gray-50">
               {/* Resumen visual de datos (read-only) */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                 <div className="bg-white p-4 rounded shadow-sm">
                   <div className="text-2xl font-bold text-blue-600">{steps.length}</div>
                   <div className="text-xs text-gray-500 uppercase tracking-wide">Pasos</div>
                 </div>
                 <div className="bg-white p-4 rounded shadow-sm">
                   <div className="text-2xl font-bold text-green-600">{deliverables.length}</div>
                   <div className="text-xs text-gray-500 uppercase tracking-wide">Entregables</div>
                 </div>
                 <div className="bg-white p-4 rounded shadow-sm">
                   <div className="text-2xl font-bold text-purple-600">{kpis.length}</div>
                   <div className="text-xs text-gray-500 uppercase tracking-wide">KPIs</div>
                 </div>
                 <div className="bg-white p-4 rounded shadow-sm">
                   <div className="text-2xl font-bold text-orange-600">{roles.filter(r => steps.some(s => s.role_id === r.id)).length}</div>
                   <div className="text-xs text-gray-500 uppercase tracking-wide">Roles</div>
                 </div>
               </div>
            </div>
            
            {/* Checklist Final */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Checklist final</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checklist.improvements}
                    onChange={(e) => setChecklist(prev => ({ ...prev, improvements: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700">He revisado las oportunidades de <strong>mejora del proceso</strong>.</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checklist.automations}
                    onChange={(e) => setChecklist(prev => ({ ...prev, automations: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700">He revisado las oportunidades de automatización.</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checklist.summary}
                    onChange={(e) => setChecklist(prev => ({ ...prev, summary: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700">Estoy conforme con el resumen del flujo de trabajo.</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleMarkAsReady}
                disabled={loading || !checklist.improvements || !checklist.automations || !checklist.summary}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : '✓ Marcar este flujo como listo'}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={loading}
                className="border-2 border-blue-500 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {loading ? 'Generando PDF...' : '📄 Exportar PDF'}
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  )
}
