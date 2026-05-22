/**
 * @file clinical-risk.store.js
 * @description Store de Pinia para clinical-risk.
 * Centraliza personal médico, registros biométricos y detección de riesgo.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { clinicalRiskApi } from '../infrastructure/clinical-risk.api.js'
import { ClinicalRiskAssembler } from '../infrastructure/clinical-risk.assembler.js'
import { useAuthStore } from '../../iam/application/auth.store.js'

export const useClinicalRiskStore = defineStore('clinicalRisk', () => {
  const staff       = ref([])
  const biometrics  = ref([])
  const loading     = ref(false)

  const riskStaff     = computed(() => staff.value.filter(s => ['critical','high','moderate'].includes(s.riskLevel)))
  const criticalStaff = computed(() => staff.value.filter(s => s.riskLevel === 'critical'))
  const highRiskStaff = computed(() => staff.value.filter(s => ['critical','high'].includes(s.riskLevel)))

  /** @returns {BiometricRecord[]} */
  const latestBiometrics = computed(() => {
    const map = {}
    for (const rec of biometrics.value) {
      const id = rec.medicalStaffId
      if (!map[id] || new Date(rec.recordedAt) > new Date(map[id].recordedAt)) {
        map[id] = rec
      }
    }
    return Object.values(map)
  })

  async function fetchStaff () {
    loading.value = true
    try { staff.value = (await clinicalRiskApi.getStaff()).sort((a,b) => b.fatigueLevel - a.fatigueLevel) }
    finally { loading.value = false }
  }

  async function fetchBiometrics () {
    loading.value = true
    try {
      const raw = await clinicalRiskApi.getBiometrics()
      biometrics.value = raw.map(r => ClinicalRiskAssembler.toBiometricEntity(r).toResource())
    } finally { loading.value = false }
  }

  /**
   * Obtiene el último registro biométrico de un médico por su staffId.
   * @param {string} staffId
   * @returns {BiometricRecord|null}
   */
  function getLatestBiometricFor (staffId) {
    return biometrics.value
      .filter(b => b.medicalStaffId === staffId)
      .sort((a,b) => new Date(b.recordedAt) - new Date(a.recordedAt))[0] || null
  }

  /**
   * Obtiene el perfil del médico autenticado.
   * @returns {Object|null}
   */
  function getMyProfile () {
    const authStore = useAuthStore()
    const currentUserId = authStore._userResource?.id
    const currentStaffId = authStore._userResource?.medicalStaffId
    return staff.value.find(s => s.id === currentStaffId || s.userId === currentUserId) || null
  }

  return {
    staff, biometrics, loading,
    riskStaff, criticalStaff, highRiskStaff, latestBiometrics,
    fetchStaff, fetchBiometrics, getLatestBiometricFor, getMyProfile
  }
})
