<template>
  <AuthLayout>
    <main class="auth-card">
      <div class="card-header">
        <h2>{{ $t('auth.register-title') }}</h2>
        <p>{{ invitation ? invitation.email : $t('auth.loading-invitation-message') }}</p>
      </div>

      <Message v-if="loadError" severity="error">{{ loadError }}</Message>

      <form v-if="invitation" class="auth-form" @submit.prevent="submit">
        <div class="form-grid">
          <div class="field">
            <label>{{ $t('auth.first-name') }}</label>
            <input
                v-model.trim="form.firstName"
                class="input"
                :placeholder="$t('auth.first-name-placeholder')"
            >
          </div>

          <div class="field">
            <label>{{ $t('auth.last-name') }}</label>
            <input
                v-model.trim="form.lastName"
                class="input"
                :placeholder="$t('auth.last-name-placeholder')"
            >
          </div>

          <div class="field">
            <label>{{ $t('auth.phone') }}</label>
            <input
                v-model.trim="form.phone"
                class="input"
                :placeholder="$t('auth.phone-placeholder')"
            >
          </div>

          <div class="field">
            <label>{{ $t('auth.password') }}</label>
            <input
                v-model="form.password"
                class="input"
                type="password"
                :placeholder="$t('auth.password-placeholder')"
            >
          </div>

          <div class="field">
            <label>{{ $t('auth.work-area') }}</label>
            <select v-model="form.workAreaId" class="select">
              <option
                  v-for="area in uniqueWorkAreas"
                  :key="area.id"
                  :value="area.id"
              >
                {{ area.name }}
              </option>
              <option :value="OTHER_OPTION">Otros</option>
            </select>

            <input
                v-if="isOtherWorkArea"
                v-model.trim="form.otherWorkArea"
                class="input"
                placeholder="Escribe el área de trabajo"
                style="margin-top: 10px"
            >
          </div>

          <div class="field">
            <label>{{ $t('auth.specialty') }}</label>
            <select v-model="form.specialtyId" class="select">
              <option
                  v-for="specialty in uniqueSpecialties"
                  :key="specialty.id"
                  :value="specialty.id"
              >
                {{ specialty.name }}
              </option>
              <option :value="OTHER_OPTION">Otros</option>
            </select>

            <input
                v-if="isOtherSpecialty"
                v-model.trim="form.otherSpecialty"
                class="input"
                placeholder="Escribe la especialidad"
                style="margin-top: 10px"
            >
          </div>
        </div>

        <small v-if="submitError" class="field-error">{{ submitError }}</small>

        <button class="submit-button" type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? $t('auth.creating-account') : $t('auth.register-submit') }}
        </button>
      </form>
    </main>
  </AuthLayout>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Message from 'primevue/message'
import AuthLayout from '../../../shared/presentation/components/auth-layout.vue'
import { createResource, listResource } from '../../../shared/infrastructure/api.service.js'
import { invitationApi } from '../../infrastructure/invitation.api.js'
import { useAuthStore } from '../../application/auth.store.js'
import { getDefaultRoute } from '../../../router.js'

const OTHER_OPTION = 'OTHER'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const invitation = ref(null)
const workAreas = ref([])
const specialties = ref([])
const loadError = ref('')
const submitError = ref('')

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  password: '',
  workAreaId: null,
  specialtyId: null,
  otherWorkArea: '',
  otherSpecialty: ''
})

const uniqueWorkAreas = computed(() => {
  const seen = new Set()
  const organizationId = Number(invitation.value?.organizationId || 0)

  return workAreas.value
      .filter(area => Number(area.organizationId) === organizationId)
      .filter(area => {
        const key = String(area.name || '').trim().toLowerCase()

        if (!key || seen.has(key)) return false

        seen.add(key)
        return true
      })
})

const uniqueSpecialties = computed(() => {
  const seen = new Set()

  return specialties.value.filter(specialty => {
    const key = String(specialty.name || '').trim().toLowerCase()

    if (!key || seen.has(key)) return false

    seen.add(key)
    return true
  })
})

const isOtherWorkArea = computed(() => String(form.workAreaId) === OTHER_OPTION)
const isOtherSpecialty = computed(() => String(form.specialtyId) === OTHER_OPTION)

onMounted(async () => {
  const token = route.query.token || 'inv-demo-doctor'

  const [foundInvitation, areas, specialtyList] = await Promise.all([
    invitationApi.findByToken(token),
    listResource('workAreas'),
    listResource('specialties')
  ])

  workAreas.value = areas
  specialties.value = specialtyList
  invitation.value = foundInvitation?.status === 'PENDING' ? foundInvitation : null

  if (!invitation.value) {
    loadError.value = t('auth.error.invitation-not-available')
    return
  }

  form.workAreaId = uniqueWorkAreas.value[0]?.id || OTHER_OPTION
  form.specialtyId = uniqueSpecialties.value[0]?.id || OTHER_OPTION
})

async function submit () {
  submitError.value = ''

  if (!form.firstName || !form.lastName || !form.password) {
    submitError.value = t('auth.error.invitation-accept-failed')
    return
  }

  if (isOtherWorkArea.value && !form.otherWorkArea) {
    submitError.value = 'Ingresa el área de trabajo.'
    return
  }

  if (isOtherSpecialty.value && !form.otherSpecialty) {
    submitError.value = 'Ingresa la especialidad.'
    return
  }

  try {
    const workAreaId = await resolveWorkAreaId()
    const specialtyId = await resolveSpecialtyId()

    const user = await authStore.registerByInvitation({
      token: invitation.value.token,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      password: form.password,
      workAreaId,
      specialtyId
    })

    router.push(getDefaultRoute(user.role))
  } catch (error) {
    submitError.value = t(error.message || 'auth.error.invitation-accept-failed')
  }
}

async function resolveWorkAreaId () {
  if (!isOtherWorkArea.value) {
    return Number(form.workAreaId)
  }

  const name = form.otherWorkArea.trim()

  const existingArea = workAreas.value.find(area =>
      Number(area.organizationId) === Number(invitation.value.organizationId) &&
      String(area.name || '').trim().toLowerCase() === name.toLowerCase()
  )

  if (existingArea) return Number(existingArea.id)

  const newArea = await createResource('workAreas', {
    organizationId: Number(invitation.value.organizationId),
    name
  })

  return Number(newArea.id)
}

async function resolveSpecialtyId () {
  if (!isOtherSpecialty.value) {
    return Number(form.specialtyId)
  }

  const name = form.otherSpecialty.trim()

  const existingSpecialty = specialties.value.find(specialty =>
      String(specialty.name || '').trim().toLowerCase() === name.toLowerCase()
  )

  if (existingSpecialty) return Number(existingSpecialty.id)

  const newSpecialty = await createResource('specialties', {
    name
  })

  return Number(newSpecialty.id)
}
</script>