<template>
  <section class="accept-page">
    <RouterLink
      class="back-button"
      to="/sign-in"
      :aria-label="$t('auth.back-to-sign-in')"
    >
      <i class="pi pi-arrow-left"></i>
    </RouterLink>

    <div class="language-switcher-wrapper">
      <LanguageSwitcher />
    </div>

    <main class="accept-shell">
      <section class="brand-panel">
        <div class="brand-content">
          <div class="brand">
            <img src="/logo.svg" :alt="$t('auth.logo-alt')">
            <span>{{ $t('app.name') }}</span>
          </div>

          <div class="brand-copy">
            <h1>{{ $t('auth.register-brand-title') }}</h1>
            <p>{{ $t('auth.register-brand-description') }}</p>
          </div>
        </div>
      </section>

      <section class="form-panel">
        <article class="accept-card">
          <header class="card-header">
            <h2>{{ $t('auth.register-title') }}</h2>
            <p>{{ $t('auth.register-subtitle') }}</p>
          </header>

          <Message v-if="loadError" severity="error" :closable="false" class="form-message">
            {{ $t(loadError) }}
          </Message>

          <Message v-if="submitError" severity="error" :closable="false" class="form-message">
            {{ $t(submitError) }}
          </Message>

          <Message v-if="successMessage" severity="success" :closable="false" class="form-message">
            {{ $t(successMessage) }}
          </Message>

          <form v-if="invitation && !successMessage" class="accept-form" @submit.prevent="submit">
            <div class="form-row">
              <div class="field">
                <label>{{ $t('auth.first-name') }}</label>
                <div class="input-control">
                  <i class="pi pi-user"></i>
                  <input
                    v-model.trim="form.firstName"
                    type="text"
                    :placeholder="$t('auth.first-name-placeholder')"
                  >
                </div>
              </div>

              <div class="field">
                <label>{{ $t('auth.last-name') }}</label>
                <div class="input-control">
                  <i class="pi pi-user"></i>
                  <input
                    v-model.trim="form.lastName"
                    type="text"
                    :placeholder="$t('auth.last-name-placeholder')"
                  >
                </div>
              </div>
            </div>

            <div class="field">
              <label>{{ $t('auth.email') }}</label>
              <div class="input-control readonly">
                <i class="pi pi-envelope"></i>
                <input
                  :value="invitation.email"
                  type="email"
                  readonly
                  aria-readonly="true"
                >
              </div>
              <small class="field-help">
                {{ $t('auth.invitation-email-locked') }}
              </small>
            </div>

            <div class="form-row">
              <div class="field">
                <label>{{ $t('auth.phone') }}</label>
                <div class="phone-control">
                  <span class="phone-prefix">+51</span>
                  <input
                    v-model.trim="form.phone"
                    type="text"
                    inputmode="numeric"
                    maxlength="9"
                    :placeholder="$t('auth.phone-placeholder')"
                    @input="normalizePhoneInput"
                  >
                </div>
              </div>

              <div class="field">
                <label>{{ $t('auth.work-area') }}</label>
                <div class="select-control">
                  <i class="pi pi-briefcase"></i>
                  <select v-model="form.workAreaId">
                    <option value="">
                      {{ $t('auth.work-area-placeholder') }}
                    </option>

                    <option
                      v-for="area in uniqueWorkAreas"
                      :key="area.id"
                      :value="area.id"
                    >
                      {{ area.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="field">
              <label>{{ $t('auth.specialty') }}</label>
              <div class="select-control">
                <i class="pi pi-heart"></i>
                <select v-model="form.specialtyId">
                  <option value="">
                    {{ $t('auth.specialty-placeholder') }}
                  </option>

                  <option
                    v-for="specialty in uniqueSpecialties"
                    :key="specialty.id"
                    :value="specialty.id"
                  >
                    {{ specialty.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="field">
              <label>{{ $t('auth.password') }}</label>
              <div class="password-control">
                <i class="pi pi-lock"></i>
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="$t('auth.password-placeholder')"
                >
                <button
                  type="button"
                  :aria-label="$t('auth.toggle-password')"
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                </button>
              </div>
            </div>

            <div class="field">
              <label>{{ $t('auth.confirm-password') }}</label>
              <div class="password-control">
                <i class="pi pi-lock"></i>
                <input
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :placeholder="$t('auth.confirm-password-placeholder')"
                >
                <button
                  type="button"
                  :aria-label="$t('auth.toggle-confirm-password')"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <i :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                </button>
              </div>
            </div>

            <button class="submit-button" type="submit" :disabled="submitting">
              <span v-if="submitting">{{ $t('auth.creating-account') }}</span>
              <span v-else>{{ $t('auth.register-submit') }}</span>
            </button>

            <p class="register-message">
              {{ $t('auth.already-have-account') }}
              <RouterLink to="/sign-in">{{ $t('auth.sign-in-link') }}</RouterLink>
            </p>
          </form>

          <RouterLink
            v-if="!invitation || successMessage"
            class="submit-button auth-link-button"
            to="/sign-in"
          >
            {{ $t('auth.back-to-sign-in') }}
          </RouterLink>
        </article>
      </section>
    </main>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Message from 'primevue/message'
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue'
import { publicHttp } from '../../../shared/infrastructure/http.js'
import { invitationApi } from '../../infrastructure/invitation.api.js'

const route = useRoute()
const router = useRouter()

const invitation = ref(null)
const workAreas = ref([])
const specialties = ref([])

const loadError = ref(null)
const submitError = ref(null)
const successMessage = ref(null)
const submitting = ref(false)

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  password: '',
  confirmPassword: '',
  workAreaId: '',
  specialtyId: ''
})

const uniqueWorkAreas = computed(() => {
  const seen = new Set()

  return workAreas.value.filter(area => {
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

onMounted(loadInvitationContext)

async function loadInvitationContext () {
  const token = route.query.token

  if (!token) {
    loadError.value = 'auth.error.invitation-token-missing'
    return
  }

  try {
    const foundInvitation = await invitationApi.findByToken(String(token))

    if (!foundInvitation) {
      loadError.value = 'auth.error.invitation-not-found'
      return
    }

    const normalizedStatus = String(foundInvitation.status || '').toUpperCase()

    if (!['PENDING', 'SENT'].includes(normalizedStatus)) {
      loadError.value = 'auth.error.invitation-not-available'
      return
    }

    invitation.value = foundInvitation

    await loadOptionalCatalogs(foundInvitation.organizationId)
  } catch {
    loadError.value = 'auth.error.invitation-not-found'
  }
}

async function loadOptionalCatalogs (organizationId) {
  const [areas, specialtyList] = await Promise.all([
    safePublicList('/workAreas', { organizationId }),
    safePublicList('/specialties')
  ])

  workAreas.value = areas
  specialties.value = specialtyList

  form.workAreaId = uniqueWorkAreas.value[0]?.id || ''
  form.specialtyId = uniqueSpecialties.value[0]?.id || ''
}

async function safePublicList (path, params = {}) {
  try {
    const response = await publicHttp.get(path, {
      params,
      skipAuthRedirect: true
    })

    return Array.isArray(response.data) ? response.data : []
  } catch {
    return []
  }
}

function normalizePhoneInput () {
  form.phone = form.phone.replace(/\D/g, '').slice(0, 9)
}

function validateForm () {
  if (!form.firstName) return 'auth.error.first-name-required'
  if (!form.lastName) return 'auth.error.last-name-required'
  if (!form.phone) return 'auth.error.phone-required'
  if (!form.password) return 'auth.error.password-required'
  if (form.password.length < 6) return 'auth.error.password-minlength'
  if (!form.confirmPassword) return 'auth.error.confirm-password-required'
  if (form.password !== form.confirmPassword) return 'auth.error.passwords-do-not-match'

  return null
}

async function submit () {
  submitError.value = null
  successMessage.value = null

  const validationError = validateForm()

  if (validationError) {
    submitError.value = validationError
    return
  }

  submitting.value = true

  try {
    await invitationApi.acceptInvitation({
      token: invitation.value.token,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: `+51 ${form.phone}`,
      password: form.password,
      workAreaId: form.workAreaId || null,
      specialtyId: form.specialtyId || null
    })

    successMessage.value = 'auth.invitation-accepted-success'

    setTimeout(() => {
      router.push('/sign-in')
    }, 1400)
  } catch {
    submitError.value = 'auth.error.invitation-accept-failed'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.accept-page {
  min-height: 100vh;
  position: relative;
  background: #f3f7fb;
}

.accept-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(360px, 0.85fr) minmax(560px, 1.15fr);
}

.brand-panel {
  padding: 56px;
  display: flex;
  align-items: center;
  background:
    linear-gradient(145deg, #071827, #0d1b2a 58%, #11293a);
  border-right: 1px solid rgba(69, 221, 229, 0.22);
}

.brand-content {
  max-width: 560px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 52px;
  color: #ffffff;
  font-size: 1.65rem;
  font-style: italic;
  font-weight: 1000;
}

.brand img {
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 12px 24px rgba(69, 221, 229, 0.24));
}

.brand-copy h1 {
  max-width: 560px;
  margin: 0;
  color: #ffffff;
  font-size: clamp(2.6rem, 4.8vw, 4.7rem);
  line-height: 1.06;
  letter-spacing: -0.07em;
  font-weight: 1000;
}

.brand-copy p {
  max-width: 520px;
  margin: 28px 0 0;
  color: #7df3ef;
  font-size: 1.15rem;
  line-height: 1.7;
  font-weight: 600;
}

.form-panel {
  min-height: 100vh;
  padding: 92px 48px 48px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at top right, rgba(69, 221, 229, 0.14), transparent 32%),
    linear-gradient(135deg, #f3f7fb, #f8fbff);
}

.accept-card {
  width: min(100%, 720px);
  padding: 38px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #dbe7ef;
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.12);
}

.card-header {
  margin-bottom: 28px;
  text-align: center;
}

.card-header h2 {
  margin: 0;
  color: #0fb7c2;
  font-size: 2.15rem;
  line-height: 1;
  letter-spacing: -0.05em;
  font-weight: 1000;
}

.card-header p {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 1rem;
  line-height: 1.5;
}

.accept-form {
  display: grid;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.field label {
  color: #0d1b2a;
  font-size: 0.9rem;
  font-weight: 900;
}

.input-control,
.phone-control,
.password-control,
.select-control {
  width: 100%;
  min-height: 56px;
  border: 1px solid #d7e0ec;
  border-radius: 14px;
  background: #ffffff;
  display: flex;
  align-items: center;
  overflow: hidden;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.input-control:focus-within,
.phone-control:focus-within,
.password-control:focus-within,
.select-control:focus-within {
  border-color: #45dde5;
  box-shadow: 0 0 0 4px rgba(69, 221, 229, 0.16);
}

.input-control i,
.password-control > i,
.select-control i {
  width: 52px;
  color: #7c91ad;
  text-align: center;
  flex-shrink: 0;
}

.input-control input,
.phone-control input,
.password-control input,
.select-control select {
  width: 100%;
  min-height: 54px;
  padding: 0 14px;
  border: 0;
  outline: none;
  background: transparent;
  color: #0d1b2a;
  font: inherit;
}

.select-control select {
  appearance: none;
  cursor: pointer;
}

.input-control.readonly {
  background: #f4f8fb;
}

.input-control.readonly input {
  color: #475569;
  cursor: not-allowed;
}

.field-help {
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 700;
}

.phone-prefix {
  min-width: 58px;
  min-height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #0fb7c2;
  background: rgba(69, 221, 229, 0.12);
  border-right: 1px solid #d7e0ec;
  font-weight: 1000;
}

.input-control input::placeholder,
.phone-control input::placeholder,
.password-control input::placeholder {
  color: #b8c6d8;
}

.password-control button {
  width: 52px;
  height: 54px;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: color 180ms ease, background 180ms ease;
}

.password-control button:hover {
  color: #0fb7c2;
  background: rgba(69, 221, 229, 0.10);
}

.submit-button {
  width: 100%;
  min-height: 56px;
  margin-top: 8px;
  border: 0;
  border-radius: 14px;
  background: #45dde5;
  color: #0d1b2a;
  font: inherit;
  font-weight: 1000;
  cursor: pointer;
  box-shadow: 0 16px 30px rgba(69, 221, 229, 0.26);
  transition: all 180ms ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.submit-button:hover {
  background: #16d6d3;
  transform: translateY(-1px);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.register-message {
  margin: 10px 0 0;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
}

.register-message a {
  color: #0fb7c2;
  font-weight: 1000;
  text-decoration: none;
}

.form-message {
  margin-bottom: 16px;
}

.auth-link-button {
  margin-top: 18px;
}

.back-button {
  position: fixed;
  top: 28px;
  left: calc(42.5vw + 28px);
  z-index: 100;
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 1px solid rgba(69, 221, 229, 0.36);
  background: #ffffff;
  color: #0fb7c2;
  text-decoration: none;
  box-shadow: 0 14px 34px rgba(69, 221, 229, 0.16);
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #0d1b2a;
  background: #95fffd;
  border-color: #45dde5;
  transform: translateY(-1px);
}

.language-switcher-wrapper {
  position: fixed;
  top: 28px;
  right: 28px;
  z-index: 100;
}

@media (max-width: 980px) {
  .accept-shell {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    display: none;
  }

  .form-panel {
    padding: 92px 20px 32px;
  }

  .back-button {
    left: 20px;
  }
}

@media (max-width: 640px) {
  .accept-card {
    padding: 26px 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .card-header h2 {
    font-size: 1.85rem;
  }

  .back-button {
    top: 20px;
    left: 20px;
    width: 48px;
    height: 48px;
  }

  .language-switcher-wrapper {
    top: 20px;
    right: 20px;
  }
}
</style>