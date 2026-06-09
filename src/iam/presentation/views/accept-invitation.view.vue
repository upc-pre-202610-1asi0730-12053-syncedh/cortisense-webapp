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
            <input v-model.trim="form.firstName" class="input" :placeholder="$t('auth.first-name-placeholder')">
          </div>
          <div class="field">
            <label>{{ $t('auth.last-name') }}</label>
            <input v-model.trim="form.lastName" class="input" :placeholder="$t('auth.last-name-placeholder')">
          </div>
          <div class="field">
            <label>{{ $t('auth.phone') }}</label>
            <input v-model.trim="form.phone" class="input" :placeholder="$t('auth.phone-placeholder')">
          </div>
          <div class="field">
            <label>{{ $t('auth.password') }}</label>
            <input v-model="form.password" class="input" type="password" :placeholder="$t('auth.password-placeholder')">
          </div>
          <div class="field">
            <label>{{ $t('auth.work-area') }}</label>
            <select v-model.number="form.workAreaId" class="select">
              <option v-for="area in workAreas" :key="area.id" :value="area.id">{{ area.name }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ $t('auth.specialty') }}</label>
            <select v-model.number="form.specialtyId" class="select">
              <option v-for="specialty in specialties" :key="specialty.id" :value="specialty.id">{{ specialty.name }}</option>
            </select>
          </div>
        </div>

        <small v-if="submitError" class="field-error">{{ submitError }}</small>
        <button class="submit-button" type="submit" :disabled="authStore.loading">{{ authStore.loading ? $t('auth.creating-account') : $t('auth.register-submit') }}</button>
      </form>
    </main>
  </AuthLayout>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Message from 'primevue/message'
import AuthLayout from '../../../shared/presentation/components/auth-layout.vue'
import { listResource } from '../../../shared/infrastructure/api.service.js'
import { invitationApi } from '../../infrastructure/invitation.api.js'
import { useAuthStore } from '../../application/auth.store.js'
import { getDefaultRoute } from '../../../router.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })
const invitation = ref(null)
const workAreas = ref([])
const specialties = ref([])
const loadError = ref('')
const submitError = ref('')
const form = reactive({ firstName: '', lastName: '', phone: '', password: '', workAreaId: null, specialtyId: null })

onMounted(async () => {
  const token = route.query.token || 'inv-demo-doctor'
  const [foundInvitation, areas, specialtyList] = await Promise.all([
    invitationApi.findByToken(token), listResource('workAreas'), listResource('specialties')
  ])
  workAreas.value = areas
  specialties.value = specialtyList
  invitation.value = foundInvitation?.status === 'PENDING' ? foundInvitation : null
  form.workAreaId = areas[0]?.id || null
  form.specialtyId = specialtyList[0]?.id || null
  if (!invitation.value) loadError.value = t('auth.error.invitation-not-available')
})

async function submit () {
  submitError.value = ''
  if (!form.firstName || !form.lastName || !form.password) {
    submitError.value = t('auth.error.invitation-accept-failed')
    return
  }
  try {
    const user = await authStore.registerByInvitation({ token: invitation.value.token, ...form })
    router.push(getDefaultRoute(user.role))
  } catch (error) {
    submitError.value = t(error.message || 'auth.error.invitation-accept-failed')
  }
}
</script>
