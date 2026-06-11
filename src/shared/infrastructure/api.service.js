import { http } from './http.js'

export const paths = {
  users: import.meta.env.VITE_USERS_ENDPOINT_PATH || '/users',
  organizations: import.meta.env.VITE_ORGANIZATIONS_ENDPOINT_PATH || '/organizations',
  careTeams: import.meta.env.VITE_CARE_TEAMS_ENDPOINT_PATH || '/careTeams',
  teamMembers: import.meta.env.VITE_TEAM_MEMBERS_ENDPOINT_PATH || '/teamMembers',
  invitations: import.meta.env.VITE_INVITATIONS_ENDPOINT_PATH || '/invitations',
  workAreas: import.meta.env.VITE_WORK_AREAS_ENDPOINT_PATH || '/workAreas',
  specialties: import.meta.env.VITE_SPECIALTIES_ENDPOINT_PATH || '/specialties',
  plans: import.meta.env.VITE_PLANS_ENDPOINT_PATH || '/plans',
  subscriptions: import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH || '/subscriptions',
  checkoutSessions: import.meta.env.VITE_CHECKOUT_SESSIONS_ENDPOINT_PATH || '/checkoutSessions',
  riskAssessments: import.meta.env.VITE_RISK_ASSESSMENTS_ENDPOINT_PATH || '/riskAssessments',
  clinicalAlerts: import.meta.env.VITE_CLINICAL_ALERTS_ENDPOINT_PATH || '/clinicalAlerts',
  vitalSignAnomalies: import.meta.env.VITE_VITAL_SIGN_ANOMALIES_ENDPOINT_PATH || '/vitalSignAnomalies',
  vitalSignReadings: import.meta.env.VITE_VITAL_SIGN_READINGS_ENDPOINT_PATH || '/vitalSignReadings',
  preventiveActions: import.meta.env.VITE_PREVENTIVE_ACTIONS_ENDPOINT_PATH || '/preventiveActions',
  shiftRecords: import.meta.env.VITE_SHIFT_RECORDS_ENDPOINT_PATH || '/shiftRecords',
  auditLogs: import.meta.env.VITE_AUDIT_LOGS_ENDPOINT_PATH || '/auditLogs'
}

export async function listResource (resource, params = {}) {
  const response = await http.get(paths[resource], { params })
  return response.data || []
}

export async function getResource (resource, id) {
  const response = await http.get(`${paths[resource]}/${id}`)
  return response.data
}

export async function createResource (resource, payload) {
  const response = await http.post(paths[resource], payload)
  return response.data
}

export async function patchResource (resource, id, payload) {
  const response = await http.patch(`${paths[resource]}/${id}`, payload)
  return response.data
}

export async function deleteResource (resource, id) {
  await http.delete(`${paths[resource]}/${id}`)
}

export function roleToVue (role) {
  const map = { HOSPITAL_ADMIN: 'admin', SUPERVISOR: 'clinical_supervisor', DOCTOR: 'medical_staff' }
  return map[role] || role
}

export function roleToApi (role) {
  const map = { admin: 'HOSPITAL_ADMIN', clinical_supervisor: 'SUPERVISOR', medical_staff: 'DOCTOR' }
  return map[role] || role
}

export function statusToLabelKey (status) {
  const value = String(status || '').toUpperCase()
  if (['ACTIVE', 'IN_PROGRESS', 'CONNECTED'].includes(value)) return 'common.active'
  if (['COMPLETED', 'ACCEPTED', 'RESOLVED', 'REVIEWED'].includes(value)) return 'common.completed'
  if (['PENDING', 'SCHEDULED', 'OPEN'].includes(value)) return 'common.pending'
  if (['INACTIVE', 'CANCELLED', 'EXPIRED'].includes(value)) return 'common.inactive'
  return 'common.status'
}

export function normalizeText (value) {
  return String(value || '').replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase())
}

export function fullName (user) {
  if (!user) return '—'
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '—'
}

export function initials (user) {
  const first = user?.firstName?.[0] || ''
  const last = user?.lastName?.[0] || ''
  return `${first}${last}`.toUpperCase() || 'CS'
}

export function riskClass (value) {
  const risk = String(value || '').toUpperCase()
  if (risk === 'CRITICAL') return 'danger'
  if (risk === 'HIGH') return 'warning'
  if (risk === 'MEDIUM' || risk === 'MODERATE') return 'info'
  return 'success'
}
