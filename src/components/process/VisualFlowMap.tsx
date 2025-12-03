'use client'

import { motion } from 'framer-motion'
import { Process, Step, Deliverable, KPI, Role } from '@/types/database'
import { useEffect, useState, useRef } from 'react'

interface VisualFlowMapProps {
  process: Process
  steps: Step[]
  roles: Role[]
  deliverables: Deliverable[]
  kpis: KPI[]
  improvements: any[]
  automations: any[]
}

interface Swimlane {
  roleId: string | null
  roleName: string
  steps: Step[]
}

export default function VisualFlowMap({
  process,
  steps,
  roles,
  deliverables,
  kpis,
  improvements,
  automations
}: VisualFlowMapProps) {
  const [swimlanes, setSwimlanes] = useState<Swimlane[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Agrupar pasos por rol para crear swimlanes
  useEffect(() => {
    const lanes: Record<string, Swimlane> = {}
    
    // Inicializar lanes con roles usados y roles predefinidos si es necesario
    // Primero, identificar todos los roles únicos en los pasos
    const usedRoleIds = new Set(steps.map(s => s.role_id))
    
    // Crear un lane para "Sin asignar" si hay pasos sin rol
    if (usedRoleIds.has(null)) {
      lanes['unassigned'] = {
        roleId: null,
        roleName: 'Sin asignar',
        steps: []
      }
    }

    // Crear lanes para roles encontrados
    roles.forEach(role => {
      if (usedRoleIds.has(role.id)) {
        lanes[role.id] = {
          roleId: role.id,
          roleName: role.name,
          steps: []
        }
      }
    })

    // Distribuir pasos en lanes
    steps.forEach(step => {
      const laneId = step.role_id || 'unassigned'
      if (lanes[laneId]) {
        lanes[laneId].steps.push(step)
      }
    })

    // Ordenar lanes (podría ser por orden de aparición del primer paso)
    const sortedLanes = Object.values(lanes).sort((a, b) => {
      const firstStepA = a.steps[0]?.position || 999
      const firstStepB = b.steps[0]?.position || 999
      return firstStepA - firstStepB
    })

    setSwimlanes(sortedLanes)
  }, [steps, roles])

  const getStepDeliverables = (stepId: string) => deliverables.filter(d => d.step_id === stepId)
  const getStepAutomations = (stepId: string) => automations.filter(a => a.stepId === stepId)
  const getStepImprovements = (stepId: string) => improvements.filter(i => i.affectedSteps.includes(stepId))

  return (
    <div className="bg-gray-50 p-8 rounded-xl overflow-x-auto border border-gray-200 shadow-inner" ref={containerRef}>
      <div className="min-w-[800px]">
        <div className="mb-6 flex items-center justify-between">
           <h3 className="text-lg font-bold text-gray-800">Mapa del Flujo de Valor</h3>
           <div className="flex gap-4 text-sm text-gray-600">
             <div className="flex items-center gap-2">
               <span className="w-3 h-3 rounded-full bg-blue-500"></span>
               <span>Paso</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="w-3 h-3 rounded-full bg-purple-500"></span>
               <span>Automatización</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="w-3 h-3 rounded-full bg-orange-500"></span>
               <span>Mejora</span>
             </div>
           </div>
        </div>

        <div className="relative space-y-4">
          {/* SVG Layer for connections could go here if we calculate positions */}
          
          {swimlanes.map((lane, laneIndex) => (
            <motion.div
              key={lane.roleId || 'unassigned'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: laneIndex * 0.1, duration: 0.5 }}
              className="flex group"
            >
              {/* Swimlane Header */}
              <div className="w-48 flex-shrink-0 p-4 bg-white border-r-4 border-blue-100 rounded-l-lg shadow-sm flex flex-col justify-center z-10 relative">
                <h4 className="font-bold text-gray-700 text-sm">{lane.roleName}</h4>
                <span className="text-xs text-gray-500 mt-1">{lane.steps.length} pasos</span>
              </div>

              {/* Swimlane Track */}
              <div className="flex-1 bg-white/50 border-y border-r border-dashed border-gray-200 rounded-r-lg flex items-center p-4 relative min-h-[120px]">
                {/* Background track line */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -z-10" />

                {/* Steps */}
                <div className="flex gap-8 items-center w-full">
                  {lane.steps.map((step, stepIndex) => {
                    const stepDeliverables = getStepDeliverables(step.id)
                    const stepAutomations = getStepAutomations(step.id)
                    const stepImprovements = getStepImprovements(step.id)
                    
                    // Calculate approximate relative position based on step.position
                    // This is a simplification; for a real Gantt/Timeline view we'd need more logic
                    
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + (step.position * 0.1), type: 'spring' }}
                        className="relative flex-shrink-0 w-48 group/card"
                        style={{ 
                          // A simple way to order them visually in the lane relative to others
                          // In a true swimlane, horizontal position usually implies time/sequence
                          // Here we just list them in order
                        }}
                      >
                        {/* Connection Line Indicator (previous/next) */}
                        <div className="absolute top-1/2 -left-4 w-4 h-0.5 bg-blue-200" />
                        
                        <div className="bg-white p-3 rounded-lg shadow border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all relative">
                          {/* Step Number Badge */}
                          <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10">
                            {step.position + 1}
                          </div>

                          {/* Badges for Improvements/Automations */}
                          <div className="absolute -top-2 -right-2 flex gap-1">
                            {stepAutomations.length > 0 && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-[10px] border border-purple-200"
                                title="Oportunidad de automatización"
                              >
                                ⚡
                              </motion.div>
                            )}
                            {stepImprovements.length > 0 && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-[10px] border border-orange-200"
                                title="Oportunidad de mejora"
                              >
                                🔧
                              </motion.div>
                            )}
                          </div>

                          <h5 className="font-medium text-sm text-gray-800 line-clamp-2 mb-2">{step.name}</h5>
                          
                          {/* Deliverables */}
                          {stepDeliverables.length > 0 && (
                            <div className="space-y-1 mt-2 pt-2 border-t border-gray-100">
                              {stepDeliverables.map(d => (
                                <div key={d.id} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded truncate flex items-center gap-1">
                                  <span>📄</span>
                                  {d.name}
                                </div>
                              ))}
                            </div>
                          )}
                          
                           {/* SLA Placeholder (Future Feature) */}
                           <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
                             <span>⏱️</span>
                             <span>Est. 30m</span>
                           </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

