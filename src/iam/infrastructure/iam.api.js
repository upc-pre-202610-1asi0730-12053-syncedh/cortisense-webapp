import {
  createResource,
  deleteResource,
  listResource,
  patchResource,
  roleToApi
} from '../../shared/infrastructure/api.service.js'
import { http } from '../../shared/infrastructure/http.js'

function readField(source, camelName, pascalName = null) {
  return source?.[camelName] ?? source?.[pascalName ?? camelName]
}

function normalizeAuthenticatedUser(payload) {
  const data = payload?.user ?? payload

  return {
    id: readField(data, 'id', 'Id'),
    organizationId: readField(data, 'organizationId', 'OrganizationId'),
    firstName: readField(data, 'firstName', 'FirstName') || '',
    lastName: readField(data, 'lastName', 'LastName') || '',
    email: readField(data, 'email', 'Email') || readField(data, 'username', 'Username') || '',
    phone: readField(data, 'phone', 'Phone') || '',
    role: readField(data, 'role', 'Role') || '',
    status: readField(data, 'status', 'Status') || 'ACTIVE',
    registrationStatus: readField(data, 'registrationStatus', 'RegistrationStatus') || 'COMPLETED',
    workAreaId: readField(data, 'workAreaId', 'WorkAreaId') ?? null,
    specialtyId: readField(data, 'specialtyId', 'SpecialtyId') ?? null,
    token: readField(payload, 'token', 'Token') || readField(data, 'token', 'Token') || ''
  }
}

export const iamApi = {
  async login({ email, password }) {
    try {
      const response = await http.post('/authentication/sign-in', {
        email: email.trim().toLowerCase(),
        password
      })

      const user = normalizeAuthenticatedUser(response.data)

      if (!user.token) {
        throw new Error('auth.error.invalid-credentials')
      }

      return user
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'auth.error.invalid-credentials'

      throw new Error(message === 'Network Error' ? 'auth.error.invalid-credentials' : message)
    }
  },

  async getUsers(params = {}) {
    return listResource('users', params)
  },

  async createUser(payload) {
    return createResource('users', {
      ...payload,
      role: roleToApi(payload.role),
      status: payload.status || 'ACTIVE'
    })
  },

  async updateUser(id, payload) {
    const clean = { ...payload }

    if (clean.role) clean.role = roleToApi(clean.role)

    return patchResource('users', id, clean)
  },

  async deleteUser(id) {
    return deleteResource('users', id)
  }
}