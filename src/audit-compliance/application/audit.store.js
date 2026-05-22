/**
 * @file audit.store.js
 * @description Store de Pinia para audit-compliance.
 * Las vistas de auditoría y reportes deben consumir este store.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auditApi } from '../infrastructure/audit.api.js'
import { AuditAssembler } from '../infrastructure/audit.assembler.js'

export const useAuditStore = defineStore('audit', () => {
  const logs    = ref([])
  const reports = ref([])
  const loading = ref(false)

  const criticalLogs = computed(() => logs.value.filter(l => l.severity === 'critical'))
  const todayLogs    = computed(() => {
    const today = new Date().toDateString()
    return logs.value.filter(l => l.timestamp && new Date(l.timestamp).toDateString() === today)
  })

  async function fetchLogs () {
    loading.value = true
    try {
      const raw = await auditApi.getLogs()
      logs.value = raw.map(r => AuditAssembler.toEntity(r).toResource())
    } finally { loading.value = false }
  }

  async function fetchReports () {
    loading.value = true
    try { reports.value = await auditApi.getReports() }
    finally { loading.value = false }
  }

  /**
   * Genera un nuevo reporte y lo agrega a la lista.
   * @param {Object} formData
   */
  async function generateReport (formData) {
    const newReport = await auditApi.createReport(formData)
    reports.value.unshift(newReport)
    return newReport
  }

  return { logs, reports, loading, criticalLogs, todayLogs, fetchLogs, fetchReports, generateReport }
})
