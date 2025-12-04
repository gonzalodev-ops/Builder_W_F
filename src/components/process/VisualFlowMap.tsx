'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Process, Step, Deliverable, KPI, Role } from '@/types/database'
import { useEffect, useState, useRef, useMemo } from 'react'

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
  const [hoveredLaneId, setHoveredLaneId] = useState<string | null>(null)
  const [activeTooltip, setActiveTooltip] = useState<{
    id: string;
    type: 'automation' | 'improvement';
    content: string;
    x: number;
    y: number;
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Constants for layout calculation
  const HEADER_WIDTH = 192 // w-48
  const CARD_WIDTH = 192 // w-48
  const GAP_X = 32 // gap-8
  const COL_WIDTH = CARD_WIDTH + GAP_X
  const ROW_HEIGHT = 200 // Fixed height for swimlanes to ensure alignment
  const ROW_GAP = 16 // space-y-4 equivalent

  // Agrupar pasos por rol para crear swimlanes
  useEffect(() => {
    const lanes: Record<string, Swimlane> = {}
    const usedRoleIds = new Set(steps.map(s => s.role_id))
    
    if (usedRoleIds.has(null)) {
      lanes['unassigned'] = { roleId: null, roleName: 'Sin asignar', steps: [] }
    }

    roles.forEach(role => {
      if (usedRoleIds.has(role.id)) {
        lanes[role.id] = { roleId: role.id, roleName: role.name, steps: [] }
      }
    })

    steps.forEach(step => {
      const laneId = step.role_id || 'unassigned'
      if (lanes[laneId]) {
        lanes[laneId].steps.push(step)
      }
    })

    const sortedLanes = Object.values(lanes).sort((a, b) => {
      const firstStepA = a.steps[0]?.position || 999
      const firstStepB = b.steps[0]?.position || 999
      return firstStepA - firstStepB
    })

    setSwimlanes(sortedLanes)
  }, [steps, roles])

  useEffect(() => {
    const handleClick = () => setActiveTooltip(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const getStepDeliverables = (stepId: string) => deliverables.filter(d => d.step_id === stepId)
  const getStepAutomations = (stepId: string) => automations.filter(a => a.stepId === stepId)
  const getStepImprovements = (stepId: string) => improvements.filter(i => i.affectedSteps.includes(stepId))

  const totalDuration = steps.reduce((acc, step) => acc + (step.sla_duration || 0), 0)
  const sortedSteps = useMemo(() => [...steps].sort((a, b) => a.position - b.position), [steps])

  // Calculate SVG paths
  const connectionPaths = useMemo(() => {
    if (swimlanes.length === 0) return []

    return sortedSteps.slice(0, -1).map((step, i) => {
      const nextStep = sortedSteps[i + 1]
      
      // Find lane indices
      const currentLaneIdx = swimlanes.findIndex(l => (l.roleId || 'unassigned') === (step.role_id || 'unassigned'))
      const nextLaneIdx = swimlanes.findIndex(l => (l.roleId || 'unassigned') === (nextStep.role_id || 'unassigned'))
      
      if (currentLaneIdx === -1 || nextLaneIdx === -1) return null

      // Coordinates relative to the SVG container (which starts at the track area)
      // Add padding-left (16px = p-4) inside track to center?
      // Track has p-4. So first card starts at x=16.
      const trackPaddingLeft = 16
      const cardCenterX = CARD_WIDTH / 2
      
      const startX = i * COL_WIDTH + trackPaddingLeft + cardCenterX
      const startY = currentLaneIdx * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2
      
      const endX = (i + 1) * COL_WIDTH + trackPaddingLeft + cardCenterX
      const endY = nextLaneIdx * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2

      const midX = (startX + endX) / 2

      return (
        <motion.path
          key={`${step.id}-${nextStep.id}`}
          d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="4 4"
          markerEnd="url(#arrowhead)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
        />
      )
    })
  }, [sortedSteps, swimlanes])

  return (
    <div className="bg-gray-50 p-8 rounded-xl overflow-x-auto border border-gray-200 shadow-inner" ref={containerRef}>
      <div className="min-w-[800px]">
        <div className="mb-6 flex items-center justify-between">
           <h3 className="text-lg font-bold text-gray-800">Mapa del Flujo de Valor</h3>
           <div className="flex gap-4 text-sm text-gray-600 items-center">
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
             <div className="flex items-center gap-2 ml-4 border-l pl-4 border-gray-300">
                <span className="font-semibold text-gray-800">Tiempo total est.:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {totalDuration > 0 ? `${totalDuration} min` : 'N/A'}
                </span>
             </div>
           </div>
        </div>

        <div className="relative">
          {/* SVG Overlay Layer */}
          <svg 
            className="absolute top-0 left-[192px] w-full h-full pointer-events-none z-0"
            style={{ 
              minWidth: sortedSteps.length * COL_WIDTH,
              height: swimlanes.length * (ROW_HEIGHT + ROW_GAP)
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>
            {connectionPaths}
          </svg>
          
          {/* Swimlanes */}
          <div className="space-y-4">
            {swimlanes.map((lane, laneIndex) => (
              <motion.div
                key={lane.roleId || 'unassigned'}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: laneIndex * 0.1, duration: 0.5 }}
                className={`flex group transition-opacity duration-300 ${
                  hoveredLaneId && hoveredLaneId !== (lane.roleId || 'unassigned') ? 'opacity-30' : 'opacity-100'
                }`}
                style={{ height: ROW_HEIGHT }}
                onMouseEnter={() => setHoveredLaneId(lane.roleId || 'unassigned')}
                onMouseLeave={() => setHoveredLaneId(null)}
              >
                {/* Swimlane Header */}
                <div 
                  className="w-48 flex-shrink-0 p-4 bg-white border-r-4 border-blue-100 rounded-l-lg shadow-sm flex flex-col justify-center z-10 relative"
                  style={{ width: HEADER_WIDTH }}
                >
                  <h4 className="font-bold text-gray-700 text-sm">{lane.roleName}</h4>
                  <span className="text-xs text-gray-500 mt-1">{lane.steps.length} pasos</span>
                </div>

                {/* Swimlane Track */}
                <div className="flex-1 bg-white/50 border-y border-r border-dashed border-gray-200 rounded-r-lg flex items-center p-4 relative">
                  {/* Background track line */}
                  <div className="absolute left-0 top-1/2 h-0.5 bg-blue-50 -z-10 w-full" />

                  {/* Steps Container */}
                  <div className="flex gap-8 items-center w-full">
                    {sortedSteps.map((step) => {
                      const isStepInLane = (step.role_id || 'unassigned') === (lane.roleId || 'unassigned')
                      
                      if (!isStepInLane) {
                         return <div key={`spacer-${step.id}`} className="w-48 flex-shrink-0" />
                      }

                      const stepDeliverables = getStepDeliverables(step.id)
                      const stepAutomations = getStepAutomations(step.id)
                      const stepImprovements = getStepImprovements(step.id)
                      
                      return (
                        <motion.div
                          key={step.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 + (step.position * 0.1), type: 'spring' }}
                          className="relative flex-shrink-0 w-48 group/card z-10"
                        >
                          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative cursor-default group-hover/card:border-blue-300">
                            {/* Step Number Badge */}
                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10">
                              {step.position + 1}
                            </div>

                            {/* Badges */}
                            <div className="absolute -top-2 -right-2 flex gap-1">
                              {stepAutomations.length > 0 && (
                                <motion.button 
                                  whileHover={{ scale: 1.2 }}
                                  className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-[10px] border border-purple-200 cursor-pointer hover:bg-purple-200"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setActiveTooltip({
                                      id: step.id,
                                      type: 'automation',
                                      content: stepAutomations.map(a => a.description).join('\n'),
                                      x: rect.left,
                                      y: rect.top
                                    })
                                  }}
                                >
                                  ⚡
                                </motion.button>
                              )}
                              {stepImprovements.length > 0 && (
                                <motion.button 
                                  whileHover={{ scale: 1.2 }}
                                  className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-[10px] border border-orange-200 cursor-pointer hover:bg-orange-200"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setActiveTooltip({
                                      id: step.id,
                                      type: 'improvement',
                                      content: stepImprovements.map(i => i.description).join('\n'),
                                      x: rect.left,
                                      y: rect.top
                                    })
                                  }}
                                >
                                  🔧
                                </motion.button>
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
                            
                             {/* SLA Actual */}
                             {step.sla_duration ? (
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-600 font-medium">
                                  <span>⏱️</span>
                                  <span>{step.sla_duration} min</span>
                                </div>
                             ) : (
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-300">
                                  <span>⏱️</span>
                                  <span>--</span>
                                </div>
                             )}
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

      {/* Tooltip flotante */}
      <AnimatePresence>
        {activeTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed z-50 bg-white p-4 rounded-lg shadow-xl border border-gray-200 max-w-xs"
            style={{ left: activeTooltip.x + 20, top: activeTooltip.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className={`font-bold mb-2 flex items-center gap-2 ${
              activeTooltip.type === 'automation' ? 'text-purple-700' : 'text-orange-700'
            }`}>
              {activeTooltip.type === 'automation' ? '⚡ Oportunidad de Automatización' : '🔧 Oportunidad de Mejora'}
            </h5>
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {activeTooltip.content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
