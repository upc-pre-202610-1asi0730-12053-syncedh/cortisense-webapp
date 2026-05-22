/**
 * @file audit.api.js
 * @description API de infraestructura para audit-compliance.
 */
import { http } from '../../shared/infrastructure/http.js'

const AUDIT_PATH   = import.meta.env.VITE_AUDIT_LOGS_ENDPOINT_PATH
const REPORTS_PATH = import.meta.env.VITE_REPORTS_ENDPOINT_PATH

export const auditApi = {
  getLogs:    () => http.get(AUDIT_PATH).then(r => r.data),
  getReports: () => http.get(REPORTS_PATH).then(r => r.data),
  createReport: (data) =>
    http.post(REPORTS_PATH, { ...data, generatedAt: new Date().toISOString() }).then(r => r.data),
  createLog: (data) =>
    http.post(AUDIT_PATH, { ...data, timestamp: new Date().toISOString() }).then(r => r.data)
}
