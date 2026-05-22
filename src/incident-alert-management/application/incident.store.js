/**
 * @file incident.store.js
 * @description Store de Pinia para alertas y acciones preventivas.
 * Bounded context: incident-alert-management
 *
 * Las vistas deben consumir este store. El store llama a incidentApi.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { incidentApi } from '../infrastructure/incident.api.js'
import { IncidentAssembler } from '../infrastructure/incident.assembler.js'
import { useAuthStore } from '../../iam/application/auth.store.js'

export const useIncidentStore = defineStore('incident', () => {
  /** @type {import('vue').Ref<import('../domain/model/alert.entity.js').Alert[]>} */
  const alerts  = ref([])
  const actions = ref([])
  const loading = ref(false)

  const pendingAlerts   = computed(() => alerts.value.filter(a => a.status === 'pending'))
  const criticalAlerts  = computed(() => alerts.value.filter(a => a.severity === 'critical'))
  const todayActions    = computed(() => {
    const today = new Date().toDateString()
    return actions.value.filter(a => new Date(a.createdAt).toDateString() === today)
  })

  /** Carga todas las alertas desde la API. */
  async function fetchAlerts () {
    loading.value = true
    try {
      const raw = await incidentApi.getAlerts()
      alerts.value = raw.map(r => IncidentAssembler.toAlertEntity(r).toResource())
    } finally { loading.value = false }
  }

  /** Carga todas las acciones preventivas. */
  async function fetchActions () {
    loading.value = true
    try {
      const raw = await incidentApi.getPreventiveActions()
      actions.value = raw.map(r => IncidentAssembler.toActionEntity(r).toResource())
    } finally { loading.value = false }
  }

  /**
   * Confirma una alerta (pending → acknowledged).
   * @param {string} alertId
   */
  async function acknowledgeAlert (alertId) {
    await incidentApi.patchAlert(alertId, { status: 'acknowledged' })
    const alert = alerts.value.find(a => a.id === alertId)
    if (alert) {
      const updated = { ...alert, status: 'acknowledged' }
      const idx = alerts.value.indexOf(alert)
      alerts.value[idx] = IncidentAssembler.toAlertEntity(updated).toResource()
    }
  }

  /**
   * Resuelve una alerta.
   * @param {string} alertId
   */
  async function resolveAlert (alertId) {
    await incidentApi.patchAlert(alertId, { status: 'resolved' })
    const alert = alerts.value.find(a => a.id === alertId)
    if (alert) {
      const updated = { ...alert, status: 'resolved' }
      const idx = alerts.value.indexOf(alert)
      alerts.value[idx] = IncidentAssembler.toAlertEntity(updated).toResource()
    }
  }

  /**
   * Crea una alerta automática al detectar riesgo elevado.
   * @param {Object} staffData - datos del personal médico
   */
  async function createAutoAlert (staffData) {
    const { fatigueLevel, riskLevel, firstName, lastName, area, id: medicalStaffId } = staffData
    const severity = riskLevel === 'critical' ? 'critical' : 'high'
    const msg = fatigueLevel >= 75
      ? `Fatiga crítica detectada — ${firstName} ${lastName} (${fatigueLevel}%)`
      : `Nivel de riesgo ${riskLevel} detectado — ${firstName} ${lastName}`

    const raw = await incidentApi.createAlert({
      medicalStaffId,
      staffName: `${firstName} ${lastName}`,
      area: area || '—',
      message: msg,
      severity,
      status: 'pending',
      type: fatigueLevel >= 75 ? 'fatigue' : 'risk'
    })
    alerts.value.unshift(IncidentAssembler.toAlertEntity(raw).toResource())
    return raw
  }

  /**
   * Registra una acción preventiva completa con efectos secundarios:
   * - Crea la acción en preventive_actions
   * - Marca la alerta como acknowledged
   * - Si es acción de descanso, crea recovery_plan
   * - Registra audit_log
   * @param {Object} formData
   */
  async function registerAction (formData) {
    const authStore = useAuthStore()
    const { staffId, alertId, type, notes, staffName, area } = formData

    // 1. Crear acción preventiva
    const actionRaw = await incidentApi.createPreventiveAction({
      staffId, alertId, type, notes,
      supervisorId: authStore._userResource?.id,
      status: 'pending'
    })
    actions.value.unshift(IncidentAssembler.toActionEntity(actionRaw).toResource())

    // 2. Marcar alerta como acknowledged si existe
    if (alertId) await acknowledgeAlert(alertId)

    // 3. Si es descanso urgente o recomendación de descanso → crear recovery plan
    const isRest = ['rest_recommendation', 'urgent_rest'].includes(type)
    if (isRest) {
      const end = new Date()
      end.setDate(end.getDate() + (type === 'urgent_rest' ? 1 : 3))
      await incidentApi.createRecoveryPlan({
        medicalStaffId: staffId,
        type: type === 'urgent_rest' ? 'rest' : 'rest',
        endDate: end.toISOString(),
        recommendations: [
          'Descansar al menos 8 horas.',
          'Hidratarse y alimentarse correctamente.',
          'Evitar actividad física intensa.',
          'No reingresar al turno sin evaluación médica.'
        ],
        triggeredBy: 'supervisor',
        message: 'Descanso urgente asignado. Tu supervisor ha asignado un descanso preventivo debido a indicadores críticos de fatiga.'
      })
    }

    // 4. Audit log
    await incidentApi.createAuditLog({
      action: 'preventive_action_registered',
      module: 'incident-alert-management',
      userId: authStore._userResource?.email || 'supervisor',
      staffId,
      details: `Acción: ${type}. ${notes || ''}`,
      severity: 'info'
    })

    return actionRaw
  }

  return {
    alerts, actions, loading,
    pendingAlerts, criticalAlerts, todayActions,
    fetchAlerts, fetchActions,
    acknowledgeAlert, resolveAlert,
    createAutoAlert, registerAction
  }
})
