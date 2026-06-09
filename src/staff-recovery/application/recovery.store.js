import { defineStore } from 'pinia'
import { ref } from 'vue'
import { recoveryApi } from '../infrastructure/recovery.api.js'
export const useRecoveryStore = defineStore('staffRecovery', () => {
  const actions = ref([])
  async function loadActions (params = {}) { actions.value = await recoveryApi.actions(params) }
  return { actions, loadActions }
})
