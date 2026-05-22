/**
 * @file incident.api.js
 * @description API de infraestructura para alertas y acciones preventivas.
 * Bounded context: incident-alert-management
 */
import { http } from '../../shared/infrastructure/http.js'

const ALERTS_PATH   = import.meta.env.VITE_ALERTS_ENDPOINT_PATH
const ACTIONS_PATH  = import.meta.env.VITE_PREVENTIVE_ACTIONS_ENDPOINT_PATH
const AUDIT_PATH    = import.meta.env.VITE_AUDIT_LOGS_ENDPOINT_PATH
const RECOVERY_PATH = import.meta.env.VITE_RECOVERY_PLANS_ENDPOINT_PATH

export const incidentApi = {
  /** @returns {Promise<Array>} */
  getAlerts: () => http.get(ALERTS_PATH).then(r => r.data),

  /** @param {string} id @param {Object} patch */
  patchAlert: (id, patch) => http.patch(`${ALERTS_PATH}/${id}`, patch).then(r => r.data),

  /**
   * Crea una alerta clínica automática.
   * @param {Object} data
   */
  createAlert: (data) => http.post(ALERTS_PATH, { ...data, createdAt: new Date().toISOString() }).then(r => r.data),

  /** @returns {Promise<Array>} */
  getPreventiveActions: () => http.get(ACTIONS_PATH).then(r => r.data),

  /** @param {Object} data */
  createPreventiveAction: (data) =>
    http.post(ACTIONS_PATH, { ...data, createdAt: new Date().toISOString() }).then(r => r.data),

  /** @param {string} id @param {Object} patch */
  patchPreventiveAction: (id, patch) => http.patch(`${ACTIONS_PATH}/${id}`, patch).then(r => r.data),

  /** @param {string} id */
  deletePreventiveAction: (id) => http.delete(`${ACTIONS_PATH}/${id}`),

  /** @param {Object} data */
  createAuditLog: (data) =>
    http.post(AUDIT_PATH, { ...data, timestamp: new Date().toISOString() }).then(r => r.data),

  /** @param {Object} data */
  createRecoveryPlan: (data) =>
    http.post(RECOVERY_PATH, { ...data, status: 'active', startDate: new Date().toISOString() }).then(r => r.data)
}
