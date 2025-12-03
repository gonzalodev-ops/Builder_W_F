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

  return (
    <Document>
      {/* Página 1: Información básica y pasos */}
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
          </View>
        </View>

        {/* Pasos y responsables */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Pasos y responsables ({steps.length})</Text>
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepItem}>
              <Text style={styles.stepNumber}>{index + 1}.</Text>
              <Text style={styles.stepName}>{step.name}</Text>
              <Text style={styles.stepRole}>👤 {getRoleName(step.role_id)}</Text>
            </View>
          ))}
        </View>

        {/* Entregables clave */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Entregables clave ({deliverables.length})</Text>
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
          <Text style={styles.sectionTitle}>4. KPIs del proceso ({kpis.length})</Text>
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

      {/* Página 2: Oportunidades */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Oportunidades identificadas</Text>
          <Text style={styles.subtitle}>{process.name}</Text>
        </View>

        {/* Resumen de oportunidades */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Mejoras del proceso</Text>
            <Text style={styles.summaryValue}>{improvements.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pasos automatizables</Text>
            <Text style={styles.summaryValue}>{automations.length}</Text>
          </View>
        </View>

        {/* Oportunidades de mejora */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Oportunidades de mejora del proceso</Text>
          {improvements.length === 0 ? (
            <Text style={styles.emptyText}>
              No se detectaron oportunidades de mejora obvias. El proceso está bien estructurado.
            </Text>
          ) : (
            improvements.map((improvement, index) => (
              <View key={index} style={styles.improvementItem}>
                <Text style={styles.improvementType}>{improvement.type}</Text>
                <Text style={styles.improvementDesc}>{improvement.description}</Text>
                {improvement.affectedSteps.length > 0 && (
                  <Text style={styles.improvementSteps}>
                    Pasos afectados: {improvement.affectedSteps.map(id => stepsMap[id]).join(', ')}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Oportunidades de automatización */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Oportunidades de automatización</Text>
          {automations.length === 0 ? (
            <Text style={styles.emptyText}>
              No se detectaron pasos automatizables con las reglas actuales.
            </Text>
          ) : (
            automations.map((automation, index) => (
              <View key={index} style={styles.automationRow}>
                <Text style={styles.automationStep}>{automation.stepName}</Text>
                <Text style={styles.automationType}>{automation.automationType}</Text>
                <Text style={styles.automationDesc}>{automation.description}</Text>
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Chispas - Herramienta de diseño de workflows | Página 2</Text>
        </View>
      </Page>
    </Document>
  )
}

