import { listResource, createResource, patchResource, deleteResource, roleToApi } from '../../shared/infrastructure/api.service.js'

function invitationToken () {
  return `inv-${Date.now()}-${Math.floor(Math.random() * 9999)}`
}

export const invitationApi = {
  async getAllInvitations () { return listResource('invitations') },
  async findByToken (token) {
    const items = await listResource('invitations', { token })
    return items[0] || null
  },
  async findPendingByEmail (email) {
    const items = await listResource('invitations', { email: email.trim().toLowerCase(), status: 'PENDING' })
    return items[0] || null
  },
  async createInvitation (payload) {
    return createResource('invitations', {
      organizationId: payload.organizationId || 1,
      email: payload.email.trim().toLowerCase(),
      role: roleToApi(payload.role),
      status: 'PENDING',
      token: invitationToken(),
      createdAt: new Date().toISOString()
    })
  },
  async acceptInvitation (id) {
    return patchResource('invitations', id, { status: 'ACCEPTED', acceptedAt: new Date().toISOString() })
  },
  async revokeInvitation (id) { return deleteResource('invitations', id) }
}
