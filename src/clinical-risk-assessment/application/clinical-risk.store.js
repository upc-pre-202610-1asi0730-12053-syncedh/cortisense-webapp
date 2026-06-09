import { defineStore } from 'pinia'
import { ref } from 'vue'
import { clinicalRiskApi } from '../infrastructure/clinical-risk.api.js'
export const useClinicalRiskStore = defineStore('clinicalRiskAssessment', () => {
  const users = ref([]); const risks = ref([]); const alerts = ref([]); const anomalies = ref([]); const teams = ref([]); const teamMembers = ref([])
  async function loadAll () { [users.value, risks.value, alerts.value, anomalies.value, teams.value, teamMembers.value] = await Promise.all([clinicalRiskApi.users(), clinicalRiskApi.risks(), clinicalRiskApi.alerts(), clinicalRiskApi.anomalies(), clinicalRiskApi.teams(), clinicalRiskApi.teamMembers()]) }
  return { users, risks, alerts, anomalies, teams, teamMembers, loadAll }
})
