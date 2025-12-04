'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { Process, Step, Deliverable, KPI } from '@/types/database'
import type { ImprovementSuggestion, AutomationSuggestion } from '@/lib/utils/suggestions'

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 3,
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '1 solid #e5e7eb',
  },
  infoGrid: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 10,
    color: '#6b7280',
    width: 100,
  },
  infoValue: {
    fontSize: 10,
    color: '#1f2937',
    flex: 1,
    fontWeight: 'bold',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 10,
  },
  stepNumber: {
    width: 30,
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  stepName: {
    flex: 1,
    fontSize: 10,
    color: '#1f2937',
  },
  stepTime: {
    fontSize: 9,
    color: '#4b5563',
    width: 60,
    textAlign: 'right',
    marginRight: 10,
  },
  stepRole: {
    fontSize: 9,
    color: '#4b5563',
    width: 120,
    textAlign: 'right',
  },
  badge: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginLeft: 5,
  },
  badgeBlue: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  badgeGreen: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeGray: {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  },
  deliverableItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 10,
  },
  kpiItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 10,
    alignItems: 'center',
  },
  kpiTarget: {
    fontSize: 9,
    color: '#16a34a',
    marginLeft: 10,
  },
  improvementItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
    borderLeft: '3 solid #3b82f6',
  },
  improvementType: {
    fontSize: 9,
    color: '#1e40af',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  improvementDesc: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 4,
  },
  improvementSteps: {
    fontSize: 8,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  automationRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#faf5ff',
    borderRadius: 3,
  },
  automationStep: {
    flex: 2,
    fontSize: 10,
    color: '#1f2937',
  },
  automationType: {
    flex: 1,
    fontSize: 9,
    color: '#7c3aed',
    fontWeight: 'bold',
  },
  automationDesc: {
    flex: 2,
    fontSize: 9,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
  summaryBox: {
    flexDirection: 'row',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 5,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  // Styles for Visual Flow Map Table
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 5,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4b5563',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #f3f4f6',
    paddingVertical: 6,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 10,
    color: '#1f2937',
  },
  colId: { width: '8%' },
  colName: { width: '35%' },
  colRole: { width: '25%' },
  colTime: { width: '12%', textAlign: 'right' },
  colNotes: { width: '20%', paddingLeft: 10 },
  indicator: {
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  indicatorAuto: {
    backgroundColor: '#faf5ff',
    color: '#7c3aed',
  },
  indicatorImp: {
    backgroundColor: '#fff7ed',
    color: '#ea580c',
  },
})

interface WorkflowPackagePDFProps {
  process: Process
  steps: Step[]
  deliverables: Deliverable[]
  kpis: KPI[]
  improvements: ImprovementSuggestion[]
  automations: AutomationSuggestion[]
  rolesMap: Record<string, string>
  stepsMap: Record<string, string>
  healthScore?: number | null
  healthSummary?: string | null
}

export const WorkflowPackagePDF: React.FC<WorkflowPackagePDFProps> = ({
  process,
  steps,
  deliverables,
  kpis,
  improvements,
  automations,
  rolesMap,
  stepsMap,
  healthScore,
  healthSummary,
}) => {
  const getRoleName = (roleId: string | null) => {
    if (!roleId) return 'Sin asignar'
    return rolesMap[roleId] || 'N/A'
  }

  const getRecipientStyle = (recipient: string) => {
    if (recipient === 'cliente') return styles.badgeBlue
    if (recipient === 'interno') return styles.badgeGreen
    return styles.badgeGray
  }

  const hasAutomation = (stepId: string) => {
    return automations.some(a => {
      // Handle both possible property names depending on where the data comes from
      return (a.stepId === stepId) || ((a as any).step_id === stepId)
    })
  }

  const hasImprovement = (stepId: string) => {
    return improvements.some(i => {
       // Handle both possible property names
       const affected = i.affectedSteps || (i as any).affected_steps || []
       return affected.includes(stepId)
    })
  }

  return (
    <Document>
      {/* Página 1: Información básica */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Workflow Package</Text>
          <Text style={styles.subtitle}>{process.name}</Text>
          <Text style={styles.subtitle}>
            Generado el {new Date().toLocaleDateString('es-MX', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Información básica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Información básica</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{process.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <Text style={styles.infoValue}>{process.type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Objetivo:</Text>
              <Text style={styles.infoValue}>{process.objective}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Disparador:</Text>
              <Text style={styles.infoValue}>{process.trigger}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tiempo Total:</Text>
              <Text style={styles.infoValue}>
                {steps.reduce((acc, s) => acc + (s.sla_duration || 0), 0)} min
              </Text>
            </View>
          </View>
        </View>

        {/* Entregables clave */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Entregables clave ({deliverables.length})</Text>
          {deliverables.length === 0 ? (
            <Text style={styles.emptyText}>No hay entregables definidos</Text>
          ) : (
            deliverables.map((deliverable, index) => (
              <View key={deliverable.id} style={styles.deliverableItem}>
                <Text style={styles.stepNumber}>{index + 1}.</Text>
                <Text style={styles.stepName}>{deliverable.name}</Text>
                <Text style={[styles.badge, getRecipientStyle(deliverable.recipient)]}>
                  {deliverable.recipient}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* KPIs del proceso */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. KPIs del proceso ({kpis.length})</Text>
          {kpis.length === 0 ? (
            <Text style={styles.emptyText}>No hay KPIs activos</Text>
          ) : (
            kpis.map((kpi, index) => (
              <View key={kpi.id} style={styles.kpiItem}>
                <Text style={styles.stepNumber}>{index + 1}.</Text>
                <Text style={styles.stepName}>{kpi.name}</Text>
                {kpi.target_value && (
                  <Text style={styles.kpiTarget}>🎯 {kpi.target_value}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Chispas - Herramienta de diseño de workflows | Página 1</Text>
        </View>
      </Page>

      {/* Página 2: Mapa de Flujo de Valor (Tabla detallada) */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Mapa de Flujo de Valor</Text>
          <Text style={styles.subtitle}>Detalle secuencial de pasos y responsables</Text>
        </View>

        <View style={styles.section}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colId]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colName]}>Paso</Text>
            <Text style={[styles.tableHeaderCell, styles.colRole]}>Rol Responsable</Text>
            <Text style={[styles.tableHeaderCell, styles.colTime]}>Duración</Text>
            <Text style={[styles.tableHeaderCell, styles.colNotes]}>Oportunidades</Text>
          </View>

          {/* Table Rows */}
          {steps.map((step, index) => (
             <View key={step.id} style={styles.tableRow}>
               <Text style={[styles.tableCell, styles.colId]}>{index + 1}</Text>
               <Text style={[styles.tableCell, styles.colName]}>{step.name}</Text>
               <Text style={[styles.tableCell, styles.colRole]}>{getRoleName(step.role_id)}</Text>
               <Text style={[styles.tableCell, styles.colTime]}>
                 {step.sla_duration ? `${step.sla_duration} min` : '-'}
               </Text>
               <View style={[styles.colNotes]}>
                 {hasAutomation(step.id) && (
                   <Text style={[styles.indicator, styles.indicatorAuto]}>⚡ Auto</Text>
                 )}
                 {hasImprovement(step.id) && (
                   <Text style={[styles.indicator, styles.indicatorImp]}>🔧 Mejora</Text>
                 )}
               </View>
             </View>
          ))}
        </View>

         {/* Footer */}
         <View style={styles.footer}>
          <Text>Chispas - Herramienta de diseño de workflows | Página 2</Text>
        </View>
      </Page>

      {/* Página 3: Diagnóstico de Salud y Matriz de Prioridades */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Diagnóstico de Salud Operativa</Text>
          <Text style={styles.subtitle}>{process.name}</Text>
        </View>

        {/* Resumen Ejecutivo de Salud */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Resumen Ejecutivo de Salud</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pasos analizados:</Text>
              <Text style={styles.infoValue}>{steps.length}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Puntaje de Fluidez:</Text>
              <Text style={styles.infoValue}>
                {healthScore !== null && healthScore !== undefined ? `${healthScore}/100` : 'No calculado'}
              </Text>
            </View>
            {healthSummary && (
              <View style={{ marginTop: 8, padding: 8, backgroundColor: '#f0f9ff', borderRadius: 4 }}>
                <Text style={{ fontSize: 10, color: '#1f2937', lineHeight: 1.5 }}>
                  {healthSummary}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Matriz de Prioridades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Matriz de Prioridades</Text>
          
          {/* Victorias Rápidas */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#16a34a', marginBottom: 4 }}>
              🟢 VICTORIAS RÁPIDAS
            </Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 6 }}>
              Implementación inmediata - Bajo esfuerzo técnico
            </Text>
            {automations.filter(a => (a as any).priority_level === 'QUICK_WIN').length === 0 ? (
              <Text style={styles.emptyText}>No se detectaron victorias rápidas</Text>
            ) : (
              automations.filter(a => (a as any).priority_level === 'QUICK_WIN').map((automation, index) => (
                <View key={index} style={{ ...styles.improvementItem, borderLeft: '3 solid #16a34a' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1f2937', marginBottom: 3 }}>
                    {(automation as any).title || automation.stepName}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#374151' }}>
                    {automation.description}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Proyectos de Eficiencia */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#eab308', marginBottom: 4 }}>
              🟡 PROYECTOS DE EFICIENCIA
            </Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 6 }}>
              Inversión estratégica - Integraciones técnicas
            </Text>
            {automations.filter(a => (a as any).priority_level === 'EFFICIENCY_PROJECT').length === 0 ? (
              <Text style={styles.emptyText}>No se detectaron proyectos de eficiencia</Text>
            ) : (
              automations.filter(a => (a as any).priority_level === 'EFFICIENCY_PROJECT').map((automation, index) => (
                <View key={index} style={{ ...styles.improvementItem, borderLeft: '3 solid #eab308' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1f2937', marginBottom: 3 }}>
                    {(automation as any).title || automation.stepName}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#374151' }}>
                    {automation.description}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Atención Requerida */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#dc2626', marginBottom: 4 }}>
              🔴 ATENCIÓN REQUERIDA
            </Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 6 }}>
              Gestión y reglas - Decisiones de liderazgo
            </Text>
            {improvements.length === 0 ? (
              <Text style={styles.emptyText}>No se detectaron obstáculos estructurales críticos</Text>
            ) : (
              improvements.map((improvement, index) => (
                <View key={index} style={{ ...styles.improvementItem, borderLeft: '3 solid #dc2626' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1f2937', marginBottom: 3 }}>
                    {(improvement as any).title || improvement.type}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#374151' }}>
                    {improvement.description}
                  </Text>
                  {improvement.affectedSteps && improvement.affectedSteps.length > 0 && (
                    <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>
                      Pasos afectados: {improvement.affectedSteps.map(id => stepsMap[id]).join(', ')}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Chispas - Herramienta de diseño de workflows | Página 3</Text>
        </View>
      </Page>
    </Document>
  )
}
