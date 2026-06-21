<template>
  <section class="registration-page">
    <a
      class="landing-back-button"
      :href="landingUrl"
      :aria-label="$t('subscription.registration.back-landing')"
    >
      <i class="pi pi-arrow-left"></i>
    </a>

    <div class="registration-language-switcher">
      <LanguageSwitcher />
    </div>

    <article class="registration-card">
      <header class="registration-header">
        <span>{{ $t('subscription.registration.badge') }}</span>
        <h1>{{ $t('subscription.registration.title') }}</h1>
        <p>{{ $t('subscription.registration.subtitle') }}</p>
      </header>

      <section v-if="selectedPlan" class="plan-summary">
        <div>
          <span>{{ $t('subscription.registration.selected-plan') }}</span>
          <h2>{{ selectedPlanName }}</h2>
          <p>{{ selectedPlanDescription }}</p>
        </div>

        <strong>
          ${{ selectedPlan.price }}
          <small>/ {{ $t('subscription.registration.month') }}</small>
        </strong>
      </section>

      <Message v-if="loadError" severity="error" :closable="false" class="form-message">
        {{ $t(loadError) }}
      </Message>

      <Message v-if="submitError" severity="error" :closable="false" class="form-message">
        {{ $t(submitError) }}
      </Message>

      <form class="registration-form" @submit.prevent="submit">
        <section class="form-section">
          <h2>{{ $t('subscription.registration.organization-title') }}</h2>

          <div class="field">
            <label>{{ $t('subscription.registration.organization-name') }}</label>
            <input
              v-model.trim="form.organizationName"
              class="registration-input"
              type="text"
              :placeholder="$t('subscription.registration.organization-name-placeholder')"
            >
          </div>

          <div class="form-row">
            <div class="field">
              <label>{{ $t('subscription.registration.ruc') }}</label>
              <input
                v-model.trim="form.ruc"
                class="registration-input"
                type="text"
                inputmode="numeric"
                maxlength="11"
                :placeholder="$t('subscription.registration.ruc-placeholder')"
                @input="normalizeRucInput"
              >
            </div>

            <div class="field">
              <label>{{ $t('subscription.registration.organization-phone') }}</label>
              <div class="phone-control">
                <span class="phone-prefix">+51</span>
                <input
                  v-model.trim="form.organizationPhone"
                  type="text"
                  inputmode="numeric"
                  maxlength="9"
                  :placeholder="$t('subscription.registration.phone-placeholder')"
                  @input="normalizePhoneInput('organizationPhone')"
                >
              </div>
            </div>
          </div>

          <div class="field">
            <label>{{ $t('subscription.registration.address') }}</label>
            <input
              v-model.trim="form.address"
              class="registration-input"
              type="text"
              :placeholder="$t('subscription.registration.address-placeholder')"
            >
          </div>
        </section>

        <section class="form-section">
          <h2>{{ $t('subscription.registration.admin-title') }}</h2>

          <div class="form-row">
            <div class="field">
              <label>{{ $t('subscription.registration.first-name') }}</label>
              <input
                v-model.trim="form.firstName"
                class="registration-input"
                type="text"
                :placeholder="$t('subscription.registration.first-name-placeholder')"
              >
            </div>

            <div class="field">
              <label>{{ $t('subscription.registration.last-name') }}</label>
              <input
                v-model.trim="form.lastName"
                class="registration-input"
                type="text"
                :placeholder="$t('subscription.registration.last-name-placeholder')"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>{{ $t('subscription.registration.email') }}</label>
              <input
                v-model.trim="form.email"
                class="registration-input"
                type="email"
                :placeholder="$t('subscription.registration.email-placeholder')"
              >
            </div>

            <div class="field">
              <label>{{ $t('subscription.registration.phone') }}</label>
              <div class="phone-control">
                <span class="phone-prefix">+51</span>
                <input
                  v-model.trim="form.phone"
                  type="text"
                  inputmode="numeric"
                  maxlength="9"
                  :placeholder="$t('subscription.registration.phone-placeholder')"
                  @input="normalizePhoneInput('phone')"
                >
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>{{ $t('subscription.registration.password') }}</label>
              <div class="password-control">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="$t('subscription.registration.password-placeholder')"
                >
                <button
                  type="button"
                  :aria-label="$t('subscription.registration.toggle-password')"
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                </button>
              </div>
            </div>

            <div class="field">
              <label>{{ $t('subscription.registration.confirm-password') }}</label>
              <div class="password-control">
                <input
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :placeholder="$t('subscription.registration.confirm-password-placeholder')"
                >
                <button
                  type="button"
                  :aria-label="$t('subscription.registration.toggle-confirm-password')"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <i :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer class="registration-actions">
          <RouterLink class="secondary-button" to="/sign-in">
            {{ $t('subscription.registration.back-login') }}
          </RouterLink>

          <button class="primary-button" type="submit" :disabled="submitting || !selectedPlan">
            <i v-if="!submitting" class="pi pi-credit-card"></i>
            <span v-if="submitting">{{ $t('subscription.registration.processing') }}</span>
            <span v-else>{{ $t('subscription.registration.pay-and-create') }}</span>
          </button>
        </footer>
      </form>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Message from 'primevue/message'
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue'
import { subscriptionApi } from '../../infrastructure/subscription.api.js'

const route = useRoute()
const { t, te } = useI18n({ useScope: 'global' })

const plans = ref([])
const loadError = ref(null)
const submitError = ref(null)
const submitting = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const landingUrl = import.meta.env.VITE_CORTISENSE_LANDING_URL || '/onboarding/basic'

const form = reactive({
  organizationName: '',
  ruc: '',
  organizationPhone: '',
  address: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const selectedPlan = computed(() => {
  const planCode = String(route.params.planCode || '').toLowerCase()
  return plans.value.find(plan => String(plan.code).toLowerCase() === planCode) || null
})

const selectedPlanName = computed(() => {
  if (!selectedPlan.value) return ''
  const key = `subscription.plans.names.${String(selectedPlan.value.code).toLowerCase()}`
  return te(key) ? t(key) : selectedPlan.value.name
})

const selectedPlanDescription = computed(() => {
  if (!selectedPlan.value) return ''
  const key = `subscription.plans.${String(selectedPlan.value.code).toLowerCase()}.description`
  return te(key) ? t(key) : ''
})

onMounted(async () => {
  try {
    plans.value = await subscriptionApi.plans()

    if (!selectedPlan.value) {
      loadError.value = 'subscription.registration.error.plan-not-found'
    }
  } catch {
    loadError.value = 'subscription.registration.error.load-plans-failed'
  }
})

function normalizeRucInput () {
  form.ruc = form.ruc.replace(/\D/g, '').slice(0, 11)
}

function normalizePhoneInput (field) {
  form[field] = form[field].replace(/\D/g, '').slice(0, 9)
}

function isValidEmail (email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateForm () {
  if (!selectedPlan.value) return 'subscription.registration.error.plan-not-found'
  if (!form.organizationName) return 'subscription.registration.error.organization-name-required'
  if (!form.ruc) return 'subscription.registration.error.ruc-required'
  if (!form.organizationPhone) return 'subscription.registration.error.organization-phone-required'
  if (!form.address) return 'subscription.registration.error.address-required'
  if (!form.firstName) return 'subscription.registration.error.first-name-required'
  if (!form.lastName) return 'subscription.registration.error.last-name-required'
  if (!form.email) return 'subscription.registration.error.email-required'
  if (!isValidEmail(form.email)) return 'subscription.registration.error.email-invalid'
  if (!form.phone) return 'subscription.registration.error.phone-required'
  if (!form.password) return 'subscription.registration.error.password-required'
  if (form.password.length < 6) return 'subscription.registration.error.password-minlength'
  if (!form.confirmPassword) return 'subscription.registration.error.confirm-password-required'
  if (form.password !== form.confirmPassword) return 'subscription.registration.error.passwords-mismatch'

  return null
}

async function submit () {
  submitError.value = null

  const validationError = validateForm()

  if (validationError) {
    submitError.value = validationError
    return
  }

  submitting.value = true

  try {
    const result = await subscriptionApi.registerOrganizationWithStripe({
      plan: selectedPlan.value,
      organization: {
        name: form.organizationName,
        ruc: form.ruc,
        phone: `+51 ${form.organizationPhone}`,
        address: form.address
      },
      administrator: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: `+51 ${form.phone}`,
        password: form.password
      }
    })

    window.location.href = result.checkoutSession.checkoutUrl
  } catch (error) {
    submitError.value = error.message?.startsWith('subscription.')
      ? error.message
      : 'subscription.registration.error.create-failed'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.registration-page {
  min-height: 100vh;
  padding: 48px 20px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at top left, rgba(69, 221, 229, 0.22), transparent 32%),
    radial-gradient(circle at bottom right, rgba(149, 255, 253, 0.24), transparent 34%),
    linear-gradient(135deg, #effcff, #f8fbff);
  box-sizing: border-box;
}

.registration-card {
  width: min(980px, 100%);
  padding: 34px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.10);
}

.registration-header {
  margin-bottom: 26px;
}

.registration-header span {
  color: #0d1b2a;
  font-size: 0.82rem;
  font-weight: 1000;
  text-transform: uppercase;
}

.registration-header h1 {
  margin: 12px 0 0;
  color: #0fb7c2;
  font-size: 2.35rem;
  font-weight: 1000;
  line-height: 1;
  letter-spacing: -0.055em;
}

.registration-header p {
  margin: 14px 0 0;
  color: #475569;
  font-size: 0.94rem;
  line-height: 1.55;
}

.landing-back-button {
  position: fixed;
  top: 28px;
  left: 28px;
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

.landing-back-button:hover {
  color: #0d1b2a;
  background: #95fffd;
  border-color: #45dde5;
  transform: translateY(-1px);
  box-shadow: 0 18px 38px rgba(69, 221, 229, 0.26);
}

.registration-language-switcher {
  position: fixed;
  top: 28px;
  right: 28px;
  z-index: 100;
}

.plan-summary {
  margin-bottom: 26px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, #2fd3dc, #4eeeeb, #3febe8);
  box-shadow: 0 18px 34px rgba(69, 221, 229, 0.22);
}

.plan-summary span {
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 1000;
  text-transform: uppercase;
}

.plan-summary h2 {
  margin: 4px 0 0;
  color: #ffffff;
  font-size: 1.7rem;
  font-weight: 1000;
  letter-spacing: -0.04em;
}

.plan-summary p {
  margin: 5px 0 0;
  color: #ffffff;
  font-size: 0.9rem;
  line-height: 1.45;
}

.plan-summary strong {
  flex-shrink: 0;
  color: #ffffff;
  font-size: 2rem;
  font-weight: 1000;
  white-space: nowrap;
}

.plan-summary small {
  font-size: 0.9rem;
  font-weight: 900;
}

.form-message {
  margin-bottom: 18px;
}

.registration-form {
  display: grid;
  gap: 24px;
}

.form-section {
  display: grid;
  gap: 14px;
}

.form-section h2 {
  margin: 0;
  color: #0d1b2a;
  font-size: 1.25rem;
  font-weight: 1000;
  letter-spacing: -0.03em;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
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

.registration-input,
.phone-control,
.password-control {
  width: 100%;
  min-height: 56px;
  border: 1px solid #d7e0ec;
  border-radius: 14px;
  background: #ffffff;
  color: #0d1b2a;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.registration-input {
  padding: 0 16px;
  outline: none;
  font: inherit;
}

.registration-input:focus,
.phone-control:focus-within,
.password-control:focus-within {
  border-color: #45dde5;
  box-shadow: 0 0 0 4px rgba(69, 221, 229, 0.16);
}

.registration-input::placeholder,
.phone-control input::placeholder,
.password-control input::placeholder {
  color: #b8c6d8;
}

.phone-control,
.password-control {
  display: flex;
  align-items: center;
  overflow: hidden;
}

.phone-prefix {
  min-width: 58px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #0fb7c2;
  background: rgba(69, 221, 229, 0.12);
  border-right: 1px solid #d7e0ec;
  font-weight: 1000;
}

.phone-control input,
.password-control input {
  width: 100%;
  height: 100%;
  min-height: 54px;
  padding: 0 16px;
  border: 0;
  outline: none;
  background: transparent;
  color: #0d1b2a;
  font: inherit;
}

.password-control button {
  width: 52px;
  height: 54px;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease;
}

.password-control button:hover {
  color: #0fb7c2;
  background: rgba(69, 221, 229, 0.10);
}

.registration-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 2px;
}

.primary-button,
.secondary-button {
  min-height: 56px;
  padding: 0 23px;
  border-radius: 14px;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 1000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.primary-button {
  border: 0;
  color: #0d1b2a;
  background: #45dde5;
  box-shadow: 0 16px 30px rgba(69, 221, 229, 0.26);
}

.primary-button:hover {
  background: #95fffd;
  transform: translateY(-1px);
}

.primary-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.secondary-button {
  color: #0d1b2a;
  border: 1px solid rgba(69, 221, 229, 0.55);
  background: rgba(149, 255, 253, 0.26);
}

.secondary-button:hover {
  background: rgba(149, 255, 253, 0.42);
}

@media (max-width: 720px) {
  .registration-page {
    padding: 88px 16px 32px;
  }

  .registration-card {
    padding: 24px;
  }

  .landing-back-button {
    top: 20px;
    left: 20px;
    width: 48px;
    height: 48px;
  }

  .registration-language-switcher {
    top: 20px;
    right: 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .plan-summary,
  .registration-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .plan-summary {
    align-items: flex-start;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }

  .registration-header h1 {
    font-size: 1.85rem;
  }
}
</style>