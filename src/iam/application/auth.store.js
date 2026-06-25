import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { iamApi } from '../infrastructure/iam.api.js'
import { invitationApi } from '../infrastructure/invitation.api.js'
import { UserAssembler } from '../infrastructure/user.assembler.js'
import { roleToApi } from '../../shared/infrastructure/api.service.js'

function readStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('cortisense_user') || 'null')
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const _userResource = ref(readStoredUser())
  const token = ref(sessionStorage.getItem('cortisense_token') || null)
  const loading = ref(false)
  const error = ref(null)

  const user = computed(() => _userResource.value ? UserAssembler.toEntity(_userResource.value) : null)
  const isAuthenticated = computed(() => Boolean(token.value && _userResource.value))
  const userRole = computed(() => {
    let role = user.value?.role || null

    if (role === "HOSPITAL_ADMIN" || role === "ADMIN") role = 'admin'
    if (role === "SUPERVISOR") role = 'clinical_supervisor'
    if (role === "DOCTOR") role = 'medical_staff'

    return String(role || '').toLowerCase()
  })

  function persistSession(rawUser) {
    if (!rawUser?.token) {
      throw new Error('auth.error.invalid-credentials')
    }

    const normalized = UserAssembler.toEntity(rawUser).toResource()

    _userResource.value = normalized
    token.value = normalized.token

    sessionStorage.setItem('cortisense_user', JSON.stringify(normalized))
    sessionStorage.setItem('cortisense_token', normalized.token)

    return normalized
  }

  async function login(credentials) {
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

  async function registerByInvitation({
    token: invitationToken,
    firstName,
    lastName,
    phone,
    password,
    workAreaId,
    specialtyId
  }) {
    loading.value = true
    error.value = null

    try {
      const response = await invitationApi.acceptInvitation({
        token: invitationToken,
        firstName,
        lastName,
        phone,
        password,
        workAreaId,
        specialtyId
      })

      const rawUser = response?.user ?? response

      if (!rawUser?.id) {
        throw new Error('auth.error.invitation-accept-failed')
      }

      return persistSession({
        ...rawUser,
        token: rawUser.token || response?.token
      })
    } catch (cause) {
      error.value = cause.message || 'auth.error.invitation-accept-failed'
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(payload) {
    if (!_userResource.value?.id) throw new Error('NO_AUTH_USER')

    const updated = await iamApi.updateUser(_userResource.value.id, payload)

    return persistSession({
      ...updated,
      token: token.value,
      role: updated.role || roleToApi(userRole.value)
    })
  }

  async function updatePassword({ newPassword }) {
    if (!_userResource.value?.id) throw new Error('NO_AUTH_USER')

    return iamApi.updateUser(_userResource.value.id, {
      password: newPassword
    })
  }

  function logout() {
    _userResource.value = null
    token.value = null

    sessionStorage.removeItem('cortisense_user')
    sessionStorage.removeItem('cortisense_token')
  }

  function restoreSession() {
    const storedUser = readStoredUser()
    const storedToken = sessionStorage.getItem('cortisense_token')

    if (storedUser && storedToken) {
      _userResource.value = storedUser
      token.value = storedToken
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    userRole,
    _userResource,
    login,
    registerByInvitation,
    updateProfile,
    updatePassword,
    logout,
    restoreSession
  }
})