import { listResource, createResource, patchResource, deleteResource, roleToApi } from '../../shared/infrastructure/api.service.js'

export const iamApi = {
  async login ({ email, password }) {
    const users = await listResource('users', { email: email.trim().toLowerCase(), password, status: 'ACTIVE' })
    if (!users.length) throw new Error('auth.error.invalid-credentials')
    return users[0]
  },

  async getUsers () { return listResource('users') },
  async createUser (payload) { return createResource('users', { ...payload, role: roleToApi(payload.role), status: payload.status || 'ACTIVE' }) },
  async updateUser (id, payload) {
    const clean = { ...payload }
    if (clean.role) clean.role = roleToApi(clean.role)
    return patchResource('users', id, clean)
  },
  async deleteUser (id) { return deleteResource('users', id) }
}
