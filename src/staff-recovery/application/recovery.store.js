/**
 * @file recovery.store.js
 * @description Store de Pinia para staff-recovery.
 * Las vistas de recuperación médica consumen este store.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { recoveryApi } from '../infrastructure/recovery.api.js'
import { RecoveryAssembler } from '../infrastructure/recovery.assembler.js'
import { useAuthStore } from '../../iam/application/auth.store.js'

export const useRecoveryStore = defineStore('recovery', () => {
  const plans   = ref([])
  const loading = ref(false)

  const activePlan = computed(() => plans.value.find(p => p.status === 'active') || null)
  const hasUrgentRest = computed(() =>
    plans.value.some(p => p.status === 'active' && p.triggeredBy === 'supervisor')
  )

  /**
   * Carga planes del médico autenticado.
   * @param {string} staffId
   */
  async function fetchMyPlans (staffId) {
    loading.value = true
    try {
      const raw = await recoveryApi.getPlansByStaff(staffId)
      plans.value = raw.map(r => RecoveryAssembler.toEntity(r).toResource())
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    } finally { loading.value = false }
  }

  /**
   * El médico acepta el plan de descanso.
   * Registra audit_log y actualiza el estado.
   * @param {string} planId
   */
  async function acceptPlan (planId) {
    const authStore = useAuthStore()
    await recoveryApi.patchPlan(planId, { status: 'accepted' })
    await recoveryApi.createLog({
      action: 'recovery_plan_accepted',
      module: 'staff-recovery',
      userId: authStore._userResource?.email || 'medical_staff',
      details: `Plan de descanso aceptado. ID: ${planId}`,
      severity: 'info'
    })
    const plan = plans.value.find(p => p.id === planId)
    if (plan) {
      const updated = { ...plan, status: 'accepted' }
      const idx = plans.value.indexOf(plan)
      plans.value[idx] = RecoveryAssembler.toEntity(updated).toResource()
    }
  }

  /**
   * El médico rechaza el plan de descanso.
   * @param {string} planId
   */
  async function rejectPlan (planId) {
    const authStore = useAuthStore()
    await recoveryApi.patchPlan(planId, { status: 'rejected' })
    await recoveryApi.createLog({
      action: 'recovery_plan_rejected',
      module: 'staff-recovery',
      userId: authStore._userResource?.email || 'medical_staff',
      details: `Plan de descanso rechazado. ID: ${planId}`,
      severity: 'warning'
    })
    const plan = plans.value.find(p => p.id === planId)
    if (plan) {
      const updated = { ...plan, status: 'rejected' }
      const idx = plans.value.indexOf(plan)
      plans.value[idx] = RecoveryAssembler.toEntity(updated).toResource()
    }
  }

  return { plans, loading, activePlan, hasUrgentRest, fetchMyPlans, acceptPlan, rejectPlan }
})
