import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { iamApi } from '../infrastructure/iam.api.js'
import { invitationApi } from '../infrastructure/invitation.api.js'
import { UserAssembler } from '../infrastructure/user.assembler.js'
import { createResource, listResource, roleToApi } from '../../shared/infrastructure/api.service.js'

function readStoredUser () {
  try { return JSON.parse(sessionStorage.getItem('cortisense_user') || 'null') } catch { return null }
}

export const useAuthStore = defineStore('auth', () => {
  const _userResource = ref(readStoredUser())
  const token = ref(sessionStorage.getItem('cortisense_token') || null)
  const loading = ref(false)
  const error = ref(null)

  const user = computed(() => _userResource.value ? UserAssembler.toEntity(_userResource.value) : null)
  const isAuthenticated = computed(() => Boolean(token.value && _userResource.value))
  const userRole = computed(() => user.value?.role || null)

  function persistSession (rawUser) {
    const normalized = UserAssembler.toEntity({ ...rawUser, token: rawUser.token || `demo-token-${rawUser.id}` }).toResource()
    _userResource.value = normalized
    token.value = normalized.token
    sessionStorage.setItem('cortisense_user', JSON.stringify(normalized))
    sessionStorage.setItem('cortisense_token', normalized.token)
    return normalized
  }

  async function login (credentials) {
    loading.value = true
    error.value = null
    try {
      const rawUser = await iamApi.login(credentials)
      return persistSession(rawUser)
    } catch (cause) {
      error.value = cause.message || 'auth.error.invalid-credentials'
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function registerByInvitation ({ token: invitationToken, firstName, lastName, phone, password, workAreaId, specialtyId }) {
    loading.value = true
    error.value = null
    try {
      const invitation = await invitationApi.findByToken(invitationToken)
      if (!invitation || invitation.status !== 'PENDING') throw new Error('auth.error.invitation-not-available')
      const existing = await listResource('users', { email: invitation.email })
      if (existing.length) throw new Error('auth.error.invitation-accept-failed')
      const user = await createResource('users', {
        organizationId: invitation.organizationId,
        firstName,
        lastName,
        email: invitation.email,
        phone,
        password,
        role: invitation.role,
        status: 'ACTIVE',
        workAreaId,
        specialtyId
      })
      await invitationApi.acceptInvitation(invitation.id)
      await createResource('auditLogs', {
        organizationId: invitation.organizationId,
        actorUserId: user.id,
        type: 'USER_REGISTERED',
        severity: 'INFO',
        resourceType: 'User',
        resourceId: user.id,
        description: `Registro completado para ${user.email}`,
        createdAt: new Date().toISOString()
      })
      return persistSession(user)
    } catch (cause) {
      error.value = cause.message || 'auth.error.invitation-accept-failed'
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function updateProfile (payload) {
    if (!_userResource.value?.id) throw new Error('NO_AUTH_USER')
    const updated = await iamApi.updateUser(_userResource.value.id, payload)
    return persistSession({ ...updated, token: token.value, role: roleToApi(userRole.value) })
  }

  async function updatePassword ({ newPassword }) {
    if (!_userResource.value?.id) throw new Error('NO_AUTH_USER')
    return iamApi.updateUser(_userResource.value.id, { password: newPassword })
  }

  function logout () {
    _userResource.value = null
    token.value = null
    sessionStorage.removeItem('cortisense_user')
    sessionStorage.removeItem('cortisense_token')
  }

  function restoreSession () {
    const storedUser = readStoredUser()
    const storedToken = sessionStorage.getItem('cortisense_token')
    if (storedUser && storedToken) {
      _userResource.value = storedUser
      token.value = storedToken
    }
  }

  return { user, token, loading, error, isAuthenticated, userRole, _userResource, login, registerByInvitation, updateProfile, updatePassword, logout, restoreSession }
})
