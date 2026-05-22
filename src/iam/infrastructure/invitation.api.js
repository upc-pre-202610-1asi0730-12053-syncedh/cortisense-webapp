/**
 * @file invitation.api.js
 * @description API de invitaciones + alta inicial de usuarios invitados.
 */

import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js'

const INVITATIONS_PATH       = import.meta.env.VITE_INVITATIONS_ENDPOINT_PATH
const MEDICAL_STAFF_PATH     = import.meta.env.VITE_MEDICAL_STAFF_ENDPOINT_PATH
const USERS_PATH             = import.meta.env.VITE_USERS_ENDPOINT_PATH
const DEVICES_PATH           = import.meta.env.VITE_DEVICES_ENDPOINT_PATH
const BIOMETRIC_RECORDS_PATH = import.meta.env.VITE_BIOMETRIC_RECORDS_ENDPOINT_PATH
const SHIFTS_PATH            = import.meta.env.VITE_SHIFTS_ENDPOINT_PATH
const AUDIT_LOGS_PATH        = import.meta.env.VITE_AUDIT_LOGS_ENDPOINT_PATH

function makeId (prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

function randomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function toDateOnly (date) {
  return date.toISOString().slice(0, 10)
}

function computeRiskLevel (fatigue) {
  if (fatigue >= 80) return 'critical'
  if (fatigue >= 65) return 'high'
  if (fatigue >= 45) return 'moderate'
  return 'low'
}

/**
 * @class InvitationApi
 * @description API de gestión de invitaciones y registro por invitación.
 */
export class InvitationApi extends BaseEndpoint {
  constructor () {
    super(INVITATIONS_PATH)
  }

  /** @param {string} email */
  async findPendingByEmail (email) {
    const response = await this.getAll({ email: email.trim().toLowerCase(), status: 'pending' })
    return response.data.length > 0 ? response.data[0] : null
  }

  async getAllInvitations () {
    const response = await this.getAll()
    return response.data
  }

  async createInvitation (payload) {
    const response = await this.create({
      ...payload,
      email: payload.email.trim().toLowerCase(),
      status: 'pending',
      createdAt: new Date().toISOString()
    })
    return response.data
  }

  async acceptInvitation (invitationId) {
    const response = await this.patch(invitationId, { status: 'accepted' })
    return response.data
  }

  /**
   * Crea un usuario activo a partir del flujo de registro por invitación.
   */
  async registerUser (command, role) {
    const { http } = await import('../../shared/infrastructure/http.js')
    const id = makeId('u')
    const token = `mock-token-${id}`
    const response = await http.post(USERS_PATH, {
      id,
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      password: command.password,
      role,
      status: 'active',
      token,
      medicalStaffId: null
    })
    return response.data
  }

  async updateUser (userId, payload) {
    const { http } = await import('../../shared/infrastructure/http.js')
    const response = await http.patch(`${USERS_PATH}/${userId}`, payload)
    return response.data
  }

  async createMedicalStaffProfile (data) {
    const { http } = await import('../../shared/infrastructure/http.js')
    const id = data.id || makeId('ms')
    const response = await http.post(MEDICAL_STAFF_PATH, {
      id,
      ...data,
      assignedDeviceId: data.assignedDeviceId ?? null
    })
    return response.data
  }

  async createDeviceForProfile (profile) {
    const { http } = await import('../../shared/infrastructure/http.js')
    const id = makeId('dev')
    const response = await http.post(DEVICES_PATH, {
      id,
      serialNumber: `CS-WS-${randomInt(1000, 9999)}`,
      model: 'CortiWatch Pro',
      assignedTo: profile.id,
      status: 'active',
      batteryLevel: randomInt(62, 98),
      firmwareVersion: 'v2.4.1',
      lastSyncAt: new Date().toISOString()
    })
    await http.patch(`${MEDICAL_STAFF_PATH}/${profile.id}`, { assignedDeviceId: id })
    return response.data
  }

  async createInitialBiometricRecords (profile, count = 8) {
    const { http } = await import('../../shared/infrastructure/http.js')
    const now = Date.now()
    const requests = []
    const records = []

    for (let i = count - 1; i >= 0; i--) {
      const recordedAt = new Date(now - i * 60 * 60 * 1000).toISOString()
      const fatigueScore = randomInt(24, 58)
      const heartRate = randomInt(64, 96)
      const hrv = randomInt(34, 72)
      const cortisolLevel = randomInt(180, 520)
      const record = {
        id: makeId('br'),
        medicalStaffId: profile.id,
        recordedAt,
        sleepHours: Number((Math.random() * 2 + 6).toFixed(1)),
        heartRate,
        hrv,
        cortisolLevel,
        cortisol: cortisolLevel,
        steps: randomInt(2500, 9000),
        activityLevel: ['low', 'moderate'][randomInt(0, 1)],
        stressLevel: randomInt(24, 64),
        fatigueScore,
        fatigueLevel: fatigueScore,
        riskLevel: computeRiskLevel(fatigueScore)
      }
      records.push(record)
      requests.push(http.post(BIOMETRIC_RECORDS_PATH, record))
    }

    await Promise.all(requests)
    const latest = records.at(-1)
    await http.patch(`${MEDICAL_STAFF_PATH}/${profile.id}`, {
      fatigueLevel: latest.fatigueScore,
      riskLevel: latest.riskLevel
    })
    return records
  }

  async createInitialShifts (profile) {
    const { http } = await import('../../shared/infrastructure/http.js')
    const today = new Date()
    const templates = [
      { type: 'morning', startTime: '07:00', endTime: '19:00' },
      { type: 'afternoon', startTime: '13:00', endTime: '21:00' },
      { type: 'night', startTime: '19:00', endTime: '07:00' }
    ]
    const offsets = [-5, -2, 0, 2, 5]

    const shifts = offsets.map((offset, idx) => {
      const date = new Date(today)
      date.setDate(today.getDate() + offset)
      const template = templates[randomInt(0, templates.length - 1)]
      const isPast = offset < 0
      const isToday = offset === 0
      return {
        id: makeId('sh'),
        medicalStaffId: profile.id,
        date: toDateOnly(date),
        startTime: template.startTime,
        endTime: template.endTime,
        type: template.type,
        area: profile.area || profile.workArea || 'General',
        status: isPast ? 'completed' : (isToday && idx % 2 === 0 ? 'active' : 'scheduled'),
        hoursWorked: isPast ? randomInt(6, 12) : 0
      }
    })

    await Promise.all(shifts.map(shift => http.post(SHIFTS_PATH, shift)))
    return shifts
  }

  async createRegistrationAuditLog (newUser, invitation) {
    const { http } = await import('../../shared/infrastructure/http.js')
    await http.post(AUDIT_LOGS_PATH, {
      id: makeId('aul'),
      userId: newUser.email,
      action: 'user_registered_by_invitation',
      module: 'iam',
      details: `Registro aceptado para ${newUser.email} con rol ${invitation.role}`,
      severity: 'info',
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1'
    })
  }

  async revokeInvitation (id) {
    await this.delete(id)
  }
}

export const invitationApi = new InvitationApi()
