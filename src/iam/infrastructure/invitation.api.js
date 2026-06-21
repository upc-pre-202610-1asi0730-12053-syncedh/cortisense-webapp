import { deleteResource, listResource, patchResource, roleToApi } from '../../shared/infrastructure/api.service.js'
import { http, publicHttp } from '../../shared/infrastructure/http.js'

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function readField(source, camelName, pascalName = null) {
  return source?.[camelName] ?? source?.[pascalName ?? camelName]
}

function normalizeInvitation(resource = {}) {
  return {
    id: readField(resource, 'id', 'Id'),
    organizationId: readField(resource, 'organizationId', 'OrganizationId'),
    email: readField(resource, 'email', 'Email') || '',
    role: readField(resource, 'role', 'Role') || '',
    status: readField(resource, 'status', 'Status') || 'PENDING',
    token: readField(resource, 'token', 'Token') || '',
    emailStatus: readField(resource, 'emailStatus', 'EmailStatus') || 'PENDING',
    resendEmailId: readField(resource, 'resendEmailId', 'ResendEmailId') || null,
    emailError: readField(resource, 'emailError', 'EmailError') || null,
    expiresAt: readField(resource, 'expiresAt', 'ExpiresAt') || null,
    sentAt: readField(resource, 'sentAt', 'SentAt') || null,
    acceptedAt: readField(resource, 'acceptedAt', 'AcceptedAt') || null,
    cancelledAt: readField(resource, 'cancelledAt', 'CancelledAt') || null,
    createdAt: readField(resource, 'createdAt', 'CreatedAt') || null,
    updatedAt: readField(resource, 'updatedAt', 'UpdatedAt') || null
  }
}

function normalizeInvitationList(items = []) {
  return items.map(normalizeInvitation)
}

export const invitationApi = {
  async getAllInvitations(params = {}) {
    const invitations = await listResource('invitations', params)
    return normalizeInvitationList(invitations)
  },

  async getInvitationsByOrganizationId(organizationId) {
    const invitations = await listResource('invitations', {
      organizationId: Number(organizationId)
    })

    return normalizeInvitationList(invitations)
  },

  async findByToken(token) {
    if (!token) return null

    const response = await publicHttp.get('/invitations', {
      params: { token },
      skipAuthRedirect: true
    })

    const items = Array.isArray(response.data)
      ? response.data
      : [response.data].filter(Boolean)

    return items.length > 0
      ? normalizeInvitation(items[0])
      : null
  },

  async findPendingByEmail(email) {
    const items = await listResource('invitations', {
      email: normalizeEmail(email)
    })

    return normalizeInvitationList(items)
      .find(invitation => ['PENDING', 'SENT'].includes(String(invitation.status).toUpperCase())) || null
  },

  async sendInvitation({ organizationId, email, role, expiresAt = null }) {
    const response = await http.post('/invitations/send', {
      organizationId: Number(organizationId),
      email: normalizeEmail(email),
      role: roleToApi(role),
      expiresAt
    })

    return normalizeInvitation(response.data)
  },

  async updateInvitation(id, payload) {
    const response = await patchResource('invitations', id, payload)
    return normalizeInvitation(response)
  },

  async cancelInvitation(id) {
    const response = await deleteResource('invitations', id)
    return normalizeInvitation(response)
  },

  async acceptInvitation({
    token,
    firstName,
    lastName,
    phone,
    password,
    workAreaId,
    specialtyId
  }) {
    const response = await publicHttp.post('/invitations/accept', {
      token,
      firstName,
      lastName,
      phone,
      password,
      workAreaId: workAreaId ? Number(workAreaId) : null,
      specialtyId: specialtyId ? Number(specialtyId) : null
    }, {
      skipAuthRedirect: true
    })

    return response.data
  }
}