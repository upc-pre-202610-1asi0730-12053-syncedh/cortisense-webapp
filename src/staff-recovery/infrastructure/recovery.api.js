/**
 * @file recovery.api.js
 * @description API de infraestructura para staff-recovery.
 */
import { http } from '../../shared/infrastructure/http.js'

const RECOVERY_PATH = import.meta.env.VITE_RECOVERY_PLANS_ENDPOINT_PATH
const AUDIT_PATH    = import.meta.env.VITE_AUDIT_LOGS_ENDPOINT_PATH

export const recoveryApi = {
  getPlans: () => http.get(RECOVERY_PATH).then(r => r.data),
  getPlansByStaff: (staffId) =>
    http.get(`${RECOVERY_PATH}?medicalStaffId=${staffId}`).then(r => r.data),
  patchPlan: (id, patch) => http.patch(`${RECOVERY_PATH}/${id}`, patch).then(r => r.data),
  createLog: (data) =>
    http.post(AUDIT_PATH, { ...data, timestamp: new Date().toISOString() }).then(r => r.data)
}
