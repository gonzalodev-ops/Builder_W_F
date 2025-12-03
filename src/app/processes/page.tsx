'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import type { Process } from '@/types/database'

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Procesos</h1>
          <p className="mt-2 text-gray-600">
            Gestiona y mejora tus flujos de trabajo
          </p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        href={`/processes/${process.id}/describe`}
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
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/processes/${process.id}/describe`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Continuar →
                      </Link>
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

