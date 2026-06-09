import { listResource, patchResource } from '../../shared/infrastructure/api.service.js'
export const clinicalRiskApi = {
  users: () => listResource('users'),
  teams: () => listResource('careTeams'),
  teamMembers: () => listResource('teamMembers'),
  risks: () => listResource('riskAssessments'),
  alerts: () => listResource('clinicalAlerts'),
  anomalies: () => listResource('vitalSignAnomalies'),
  readings: params => listResource('vitalSignReadings', params),
  patchAlert: (id, payload) => patchResource('clinicalAlerts', id, payload),
  patchAnomaly: (id, payload) => patchResource('vitalSignAnomalies', id, payload)
}
