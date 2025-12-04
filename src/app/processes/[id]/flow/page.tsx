'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StageProgressBar from '@/components/StageProgressBar'
import PageTransition from '@/components/ui/PageTransition'
import AnimatedButton from '@/components/ui/AnimatedButton'
import { supabase } from '@/lib/supabase/client'
import type { Step, Role } from '@/types/database'
import { PREDEFINED_ROLES } from '@/lib/constants/roles'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Componente para cada paso arrastrable
function SortableStepItem({ 
  step, 
  index, 
  isSelected, 
  onClick, 
  roleName 
}: { 
  step: Step
  index: number
  isSelected: boolean
  onClick: () => void
  roleName: string | null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icono de drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </button>
        
        <span className="font-semibold text-gray-500 min-w-[30px]">
          {index + 1}.
        </span>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{step.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {roleName ? (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs">
                👤 {roleName}
              </span>
            ) : (
              <span className="text-orange-600">⚠️ Sin responsable asignado</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FlowPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [steps, setSteps] = useState<Step[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

      // Cargar roles predefinidos
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .is('company_id', null)
        .eq('is_predefined', true)

      if (rolesError) throw rolesError
      setRoles(rolesData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStep = async (stepId: string, updates: Partial<Step>) => {
    try {
      const { error } = await supabase
        .from('steps')
        .update(updates)
        .eq('id', stepId)

      if (error) throw error

      // Actualizar localmente
      setSteps(steps.map(s => s.id === stepId ? { ...s, ...updates } : s))
    } catch (error) {
      console.error('Error al actualizar paso:', error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = steps.findIndex((s) => s.id === active.id)
    const newIndex = steps.findIndex((s) => s.id === over.id)

    // Reordenar localmente
    const newSteps = arrayMove(steps, oldIndex, newIndex)
    
    // Actualizar posiciones
    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      position: index
    }))
    
    setSteps(updatedSteps)

    // Guardar en Supabase
    try {
      setSaving(true)
      
      // Actualizar todas las posiciones
      const updates = updatedSteps.map(step => ({
        id: step.id,
        position: step.position
      }))

      for (const update of updates) {
        await supabase
          .from('steps')
          .update({ position: update.position })
          .eq('id', update.id)
      }
    } catch (error) {
      console.error('Error al reordenar pasos:', error)
      // Revertir cambios en caso de error
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const handleContinue = () => {
    router.push(`/processes/${params.id}/deliverables`)
  }

  const allStepsHaveRoles = steps.every(s => s.role_id !== null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando flujo...</p>
      </div>
    )
  }

  const selectedStep = steps.find(s => s.id === selectedStepId)

  return (
    <div className="min-h-screen bg-gray-50">
      <StageProgressBar processId={params.id} />
      
      <PageTransition className="max-w-[95%] xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Paso 2 de 5</span>
                <span>→</span>
                <span>Flujo</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Flujo del proceso</h1>
              <p className="mt-2 text-gray-600">
                Objetivo: ordenar el proceso y asignar responsables
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => router.push('/processes')}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline flex items-center gap-1"
              >
                ← Volver a procesos
              </button>
              {saving && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Guardando...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Panel izquierdo - Lista de pasos */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Pasos del proceso ({steps.length})
                </h2>
                <p className="text-sm text-gray-500">
                  💡 Arrastra para reordenar
                </p>
              </div>
              
              {/* Diagrama lineal simple */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg overflow-x-auto">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 bg-green-500 text-white rounded text-sm font-medium">
                    Inicio
                  </div>
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className="text-gray-400">→</div>
                      <button
                        onClick={() => setSelectedStepId(step.id)}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          selectedStepId === step.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        {index + 1}
                      </button>
                    </div>
                  ))}
                  <div className="text-gray-400">→</div>
                  <div className="px-3 py-2 bg-red-500 text-white rounded text-sm font-medium">
                    Fin
                  </div>
                </div>
              </div>

              {/* Lista de pasos con drag & drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={steps.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {steps.map((step, index) => {
                      const stepRole = roles.find(r => r.id === step.role_id)
                      return (
                        <SortableStepItem
                          key={step.id}
                          step={step}
                          index={index}
                          isSelected={selectedStepId === step.id}
                          onClick={() => setSelectedStepId(step.id)}
                          roleName={stepRole?.name || null}
                        />
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

          {/* Panel derecho - Detalles y checklist */}
          <div className="col-span-1 space-y-6">
            {/* Detalles del paso seleccionado */}
            {selectedStep ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">Detalles del paso</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del paso
                    </label>
                    <input
                      type="text"
                      value={selectedStep.name}
                      onChange={(e) => handleUpdateStep(selectedStep.id, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsable
                    </label>
                    <select
                      value={selectedStep.role_id || ''}
                      onChange={(e) => handleUpdateStep(selectedStep.id, { role_id: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Sin asignar</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración estimada (minutos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={selectedStep.sla_duration || 0}
                      onChange={(e) => handleUpdateStep(selectedStep.id, { sla_duration: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tiempo estimado para completar este paso.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm text-center">
                  Selecciona un paso para ver sus detalles
                </p>
              </div>
            )}

            {/* Checklist */}
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
                    checked={allStepsHaveRoles}
                    readOnly
                    className="mt-1"
                  />
                  <span className="text-gray-700">
                    Todos los pasos tienen responsable
                  </span>
                </label>
              </div>

              {allStepsHaveRoles && steps.length >= 3 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">¡Flujo listo!</span>
                  </div>
                  <AnimatedButton
                    onClick={handleContinue}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Continuar a entregables ▶
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

