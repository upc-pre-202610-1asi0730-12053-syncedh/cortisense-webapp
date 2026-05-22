/**
 * @file auth.store.js
 * @description Store de Pinia para autenticación en CortiSense.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { iamApi } from '../infrastructure/iam.api.js'
import { invitationApi } from '../infrastructure/invitation.api.js'
import { UserAssembler } from '../infrastructure/user.assembler.js'
import { LoginCommand } from '../domain/commands/login.command.js'
import { RegisterByInvitationCommand } from '../domain/commands/register-by-invitation.command.js'

export const useAuthStore = defineStore('auth', () => {
  const _userResource = ref((() => {
    try { return JSON.parse(sessionStorage.getItem('cortisense_user') || 'null') }
    catch { return null }
  })())

  const token = ref(sessionStorage.getItem('cortisense_token') || null)

  const user = computed(() =>
    _userResource.value ? UserAssembler.toEntity(_userResource.value) : null
  )

  const isAuthenticated = computed(() => !!token.value && !!_userResource.value)
  const userRole = computed(() => _userResource.value?.role ?? null)

  function persistSession (resource) {
    _userResource.value = resource
    token.value = resource?.token || null

    if (resource && token.value) {
      sessionStorage.setItem('cortisense_token', token.value)
      sessionStorage.setItem('cortisense_user', JSON.stringify(resource))
    }
  }

  async function login ({ email, password }) {
    const command = new LoginCommand({ email, password })
    const rawUser = await iamApi.login(command)
    const entity = UserAssembler.toEntity(rawUser)
    const resource = entity.toResource()
    persistSession(resource)
    return entity
  }

  /**
   * Registro por invitación.
   * Si el invitado es personal médico, se le crea perfil, dispositivo IoT,
   * métricas iniciales y turnos demo para que no ingrese con pantallas vacías.
   */
  async function register (formData) {
    const command = new RegisterByInvitationCommand(formData)
    if (!command.isValid()) throw new Error('INVALID_REGISTER_DATA')

    const invitation = await invitationApi.findPendingByEmail(command.email)
    if (!invitation) throw new Error('NO_INVITATION')

    const newUser = await invitationApi.registerUser(command, invitation.role)

    const requiresProfile = ['medical_staff', 'clinical_supervisor'].includes(invitation.role)
    if (requiresProfile) {
      const profile = await invitationApi.createMedicalStaffProfile({
        userId: newUser.id,
        firstName: command.firstName,
        lastName: command.lastName,
        email: command.email,
        workArea: command.workArea || 'General',
        area: command.workArea || 'General',
        specialty: command.specialty || 'General',
        role: invitation.role,
        staffRole: invitation.role,
        status: 'active',
        riskLevel: 'low',
        fatigueLevel: 0,
        assignedDeviceId: null
      })

      await invitationApi.updateUser(newUser.id, { medicalStaffId: profile.id })

      if (invitation.role === 'medical_staff') {
        await invitationApi.createDeviceForProfile(profile)
        await invitationApi.createInitialBiometricRecords(profile)
        await invitationApi.createInitialShifts(profile)
      }
    }

    await invitationApi.acceptInvitation(invitation.id)
    await invitationApi.createRegistrationAuditLog(newUser, invitation)
  }

  async function updateProfile ({ firstName, lastName }) {
    if (!_userResource.value?.id) throw new Error('NO_AUTH_USER')

    const clean = {
      firstName: (firstName || '').trim(),
      lastName: (lastName || '').trim()
    }

    const updatedUser = await iamApi.updateUser(_userResource.value.id, clean)
    const nextResource = UserAssembler.toEntity({
      ..._userResource.value,
      ...updatedUser
    }).toResource()

    _userResource.value = nextResource
    sessionStorage.setItem('cortisense_user', JSON.stringify(nextResource))

    if (['medical_staff', 'clinical_supervisor'].includes(nextResource.role)) {
      const { http } = await import('../../shared/infrastructure/http.js')
      const staffPath = import.meta.env.VITE_MEDICAL_STAFF_ENDPOINT_PATH
      let staffId = nextResource.medicalStaffId

      if (!staffId) {
        const staffResponse = await http.get(staffPath, { params: { userId: nextResource.id } })
        staffId = staffResponse.data?.[0]?.id || null
      }

      if (staffId) {
        await http.patch(`${staffPath}/${staffId}`, clean)
        if (!nextResource.medicalStaffId) {
          nextResource.medicalStaffId = staffId
          _userResource.value = nextResource
          sessionStorage.setItem('cortisense_user', JSON.stringify(nextResource))
        }
      }
    }

    return nextResource
  }

  async function updatePassword ({ currentPassword, newPassword }) {
    if (!_userResource.value?.id) throw new Error('NO_AUTH_USER')
    const raw = await iamApi.updateUser(_userResource.value.id, { password: newPassword })
    return raw
  }

  function logout () {
    _userResource.value = null
    token.value = null
    sessionStorage.removeItem('cortisense_token')
    sessionStorage.removeItem('cortisense_user')
    localStorage.removeItem('cortisense_token')
    localStorage.removeItem('cortisense_user')
  }

  function restoreSession () {
    try {
      const storedUser = sessionStorage.getItem('cortisense_user')
      const storedToken = sessionStorage.getItem('cortisense_token')
      if (storedUser && storedToken) {
        _userResource.value = JSON.parse(storedUser)
        token.value = storedToken
      }
    } catch { logout() }
  }

  return {
    user,
    token,
    isAuthenticated,
    userRole,
    _userResource,
    login,
    register,
    updateProfile,
    updatePassword,
    logout,
    restoreSession
  }
})
