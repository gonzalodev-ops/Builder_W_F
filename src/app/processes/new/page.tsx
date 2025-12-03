'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function NewProcessPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    type: '',
    trigger: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Por ahora usamos la compañía demo (en el futuro será del usuario autenticado)
      const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001'

      // Insertar el proceso en Supabase
      const { data, error: insertError } = await supabase
        .from('processes')
        .insert([
          {
            company_id: DEMO_COMPANY_ID,
            name: formData.name,
            objective: formData.objective,
            type: formData.type,
            trigger: formData.trigger,
            status: 'borrador',
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Redirigir a la etapa de describir con el ID del proceso creado
      router.push(`/processes/${data.id}/describe`)
    } catch (err) {
      console.error('Error al crear proceso:', err)
      setError('Error al crear el proceso. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/processes" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Volver a procesos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Proceso</h1>
          <p className="mt-2 text-gray-600">
            Completa la información básica para comenzar
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre del proceso */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del proceso *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Onboarding de nuevo cliente"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Objetivo */}
            <div>
              <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-2">
                Objetivo (1-2 líneas) *
              </label>
              <textarea
                id="objective"
                required
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                placeholder="¿Qué se busca lograr con este proceso?"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tipo de proceso */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de proceso *
              </label>
              <select
                id="type"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona un tipo</option>
                <option value="cliente">Cliente</option>
                <option value="interno">Interno</option>
                <option value="fiscal">Fiscal</option>
                <option value="rh">Recursos Humanos</option>
                <option value="operativo">Operativo</option>
                <option value="financiero">Financiero</option>
              </select>
            </div>

            {/* Disparador */}
            <div>
              <label htmlFor="trigger" className="block text-sm font-medium text-gray-700 mb-2">
                Disparador *
              </label>
              <input
                type="text"
                id="trigger"
                required
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                placeholder="¿Qué evento inicia este proceso?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Ej: "Cliente firma contrato", "Solicitud de empleado", etc.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Link
                href="/processes"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Continuar →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

