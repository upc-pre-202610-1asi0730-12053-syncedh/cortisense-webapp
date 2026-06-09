import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auditApi } from '../infrastructure/audit.api.js'
export const useAuditStore = defineStore('auditCompliance', () => {
  const logs = ref([])
  async function loadLogs (params = {}) { logs.value = await auditApi.logs(params) }
  return { logs, loadLogs }
})
