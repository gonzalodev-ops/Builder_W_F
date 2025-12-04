'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

interface Stage {
  id: string
  name: string
  path: string
}

interface StageProgressBarProps {
  processId: string
}

const stages: Stage[] = [
  { id: '1', name: 'Describir', path: 'describe' },
  { id: '2', name: 'Flujo', path: 'flow' },
  { id: '3', name: 'Entregables', path: 'deliverables' },
  { id: '4', name: 'KPIs', path: 'kpis' },
  { id: '5', name: 'Mejoras y Resumen', path: 'summary' },
]

export default function StageProgressBar({ processId }: StageProgressBarProps) {
  const pathname = usePathname()
  
  const currentStageIndex = stages.findIndex(stage => 
    pathname?.includes(`/${stage.path}`)
  )

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[95%] xl:max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const isActive = pathname?.includes(`/${stage.path}`)
            const isCompleted = currentStageIndex > index
            const isAccessible = true 

            return (
              <div key={stage.id} className="flex items-center flex-1">
                <Link
                  href={`/processes/${processId}/${stage.path}`}
                  className={`flex items-center ${!isAccessible && 'pointer-events-none'} relative group`}
                >
                  <div className="flex items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        backgroundColor: isActive ? '#2563eb' : isCompleted ? '#22c55e' : '#e5e7eb',
                        color: isActive || isCompleted ? '#ffffff' : '#4b5563',
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold z-10 shadow-sm relative"
                    >
                      {isCompleted ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          ✓
                        </motion.span>
                      ) : (
                        stage.id
                      )}
                      
                      {/* Glow effect for active step */}
                      {isActive && (
                        <motion.div
                          layoutId="active-glow"
                          className="absolute inset-0 rounded-full bg-blue-400 opacity-30 blur-md"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1.5 }}
                          transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
                        />
                      )}
                    </motion.div>
                    
                    <motion.span
                      animate={{
                        color: isActive ? '#2563eb' : '#4b5563',
                        fontWeight: isActive ? 600 : 500
                      }}
                      className="ml-2 text-sm whitespace-nowrap hidden md:block"
                    >
                      {stage.name}
                    </motion.span>
                  </div>
                </Link>
                
                {index < stages.length - 1 && (
                  <div className="flex-1 h-1 mx-2 md:mx-4 rounded bg-gray-200 relative overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="absolute top-0 left-0 h-full bg-green-500"
                    />
                    {/* Active progress hint */}
                    {isActive && (
                       <motion.div
                       initial={{ width: '0%' }}
                       animate={{ width: '50%' }}
                       transition={{ duration: 1, ease: "easeOut" }}
                       className="absolute top-0 left-0 h-full bg-blue-200 opacity-50"
                     />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
