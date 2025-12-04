'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Process } from '@/types/database'

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchProcesses()
  }, [])

  const fetchProcesses = async () => {
    try {
      const { data, error } = await supabase
        .from('processes')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setProcesses(data || [])
    } catch (error) {
      console.error('Error al cargar procesos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProcess = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proceso? Esta acción no se puede deshacer.')) return

    setProcessingId(id)
    try {
      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProcesses(processes.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error al eliminar proceso:', error)
      alert('Error al eliminar el proceso')
    } finally {
      setProcessingId(null)
    }
  }

  const handleCloneProcess = async (originalProcess: Process) => {
    setProcessingId(originalProcess.id)
    try {
      // 1. Clonar proceso
      const { data: newProcess, error: processError } = await supabase
        .from('processes')
        .insert([{
          name: `Copia de ${originalProcess.name}`,
          objective: originalProcess.objective,
          type: originalProcess.type,
          trigger: originalProcess.trigger,
          status: 'borrador',
          capture_method: originalProcess.capture_method
        }])
        .select()
        .single()

      if (processError) throw processError

      // 2. Obtener pasos originales
      const { data: originalSteps } = await supabase
        .from('steps')
        .select('*')
        .eq('process_id', originalProcess.id)
        .order('position')

      if (originalSteps && originalSteps.length > 0) {
        // Mapa para relacionar IDs viejos con nuevos
        const stepIdMap: Record<string, string> = {}

        for (const step of originalSteps) {
          const { data: newStep, error: stepError } = await supabase
            .from('steps')
            .insert([{
              process_id: newProcess.id,
              name: step.name,
              role_id: step.role_id,
              description: step.description,
              position: step.position,
              sla_duration: step.sla_duration
            }])
            .select()
            .single()

          if (stepError) throw stepError
          stepIdMap[step.id] = newStep.id

          // 3. Clonar entregables del paso
          const { data: deliverables } = await supabase
            .from('deliverables')
            .select('*')
            .eq('step_id', step.id)

          if (deliverables && deliverables.length > 0) {
            await supabase.from('deliverables').insert(
              deliverables.map(d => ({
                step_id: newStep.id,
                name: d.name,
                type: d.type,
                recipient: d.recipient,
                description: d.description
              }))
            )
          }
        }
      }

      // 4. Clonar KPIs
      const { data: kpis } = await supabase
        .from('kpis')
        .select('*')
        .eq('process_id', originalProcess.id)

      if (kpis && kpis.length > 0) {
        await supabase.from('kpis').insert(
          kpis.map(k => ({
            process_id: newProcess.id,
            name: k.name,
            description: k.description,
            metric_type: k.metric_type,
            is_active: k.is_active,
            target_value: k.target_value
          }))
        )
      }

      // Recargar lista
      await fetchProcesses()
      alert('Proceso clonado exitosamente')
    } catch (error) {
      console.error('Error al clonar proceso:', error)
      alert('Error al clonar el proceso')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredProcesses = processes.filter((process) => {
    const matchesSearch = process.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || process.type === filterType
    return matchesSearch && matchesType
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    if (status === 'listo') {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Listo</span>
    }
    return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Borrador</span>
    
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      cliente: 'Cliente',
      interno: 'Interno',
      fiscal: 'Fiscal',
      rh: 'Recursos Humanos',
      operativo: 'Operativo',
      financiero: 'Financiero',
    }
    return types[type] || type
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[95%] xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Procesos</h1>
            <p className="mt-2 text-gray-600">
              Gestiona y mejora tus flujos de trabajo
            </p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            <span>Cerrar Sesión</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Buscar procesos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              <option value="cliente">Cliente</option>
              <option value="interno">Interno</option>
              <option value="fiscal">Fiscal</option>
              <option value="rh">Recursos Humanos</option>
              <option value="operativo">Operativo</option>
              <option value="financiero">Financiero</option>
            </select>
          </div>
          <Link
            href="/processes/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Nuevo Proceso
          </Link>
        </div>

        {/* Processes Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre del Proceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última edición
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <p>Cargando procesos...</p>
                  </td>
                </tr>
              ) : filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <p className="text-lg mb-4">
                        {processes.length === 0 ? 'No tienes procesos aún' : 'No se encontraron procesos'}
                      </p>
                      <Link
                        href="/processes/new"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Crear tu primer proceso →
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((process) => (
                  <tr key={process.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link 
                        href={process.status === 'listo' ? `/processes/${process.id}/summary` : `/processes/${process.id}/describe`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {process.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">{process.objective}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getTypeLabel(process.type)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(process.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(process.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleCloneProcess(process)}
                          disabled={processingId === process.id}
                          className="text-gray-500 hover:text-blue-600 disabled:opacity-50"
                          title="Clonar proceso"
                        >
                          {processingId === process.id ? '...' : '📄'}
                        </button>
                        <button
                          onClick={() => handleDeleteProcess(process.id)}
                          disabled={processingId === process.id}
                          className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                          title="Eliminar proceso"
                        >
                          {processingId === process.id ? '...' : '🗑️'}
                        </button>
                        {process.status === 'listo' && (
                          <Link
                            href={`/processes/${process.id}/summary`}
                            className="text-green-600 hover:text-green-800 font-medium"
                            title="Visualizar resultado"
                          >
                            👁️
                          </Link>
                        )}
                        <Link
                          href={`/processes/${process.id}/describe`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          title="Editar proceso"
                        >
                          ✏️
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
