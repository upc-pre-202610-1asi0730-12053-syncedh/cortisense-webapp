<!--
  @file sign-up.view.vue
  @description Registro por invitación — mismo split layout que el login.
-->
<template>
  <div class="auth-layout">
    <!-- Panel izquierdo -->
    <div class="auth-left">
      <div class="auth-left-inner">
        <div class="auth-brand">
          <div class="auth-brand-icon">+</div>
          <span class="auth-brand-name">CortiSense</span>
        </div>
        <h1 class="auth-hero-title">{{ $t('auth.registerTitle') }}</h1>
        <p class="auth-hero-desc">{{ $t('auth.registerSubtitle') }}</p>

        <div class="auth-info-box">
          <div class="auth-info-icon">📋</div>
          <div class="auth-info-text">
            <strong>{{ $t('auth.howItWorks') }}</strong><br>
            {{ $t('auth.inviteOnly') }}
          </div>
        </div>

        <div class="auth-info-box" style="margin-top:12px;">
          <div class="auth-info-icon">🔒</div>
          <div class="auth-info-text">
            {{ $t('auth.secureBiometrics') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Panel derecho -->
    <div class="auth-right">
      <div class="auth-lang-top">
        <LanguageSwitcher />
      </div>

      <div class="auth-form-wrap">
        <h2 class="auth-form-title">{{ $t('auth.signUp') }}</h2>
        <p class="auth-form-subtitle">{{ $t('auth.registerSubtitle') }}</p>

        <!-- Éxito -->
        <div v-if="success" class="auth-success-banner">
          <i class="pi pi-check-circle"></i> {{ $t('auth.registerSuccess') }}
          <RouterLink to="/auth/sign-in" class="auth-link" style="margin-left:8px;">{{ $t('auth.goToLogin') }}</RouterLink>
        </div>

        <form v-else @submit.prevent="handleRegister" class="auth-form">
          <div class="form-row">
            <div class="cs-form-group">
              <label class="cs-form-label">{{ $t('auth.firstName') }}</label>
              <InputText id="reg-fname" v-model="form.firstName" :placeholder="$t('auth.firstNamePlaceholder')" style="width:100%;" />
            </div>
            <div class="cs-form-group">
              <label class="cs-form-label">{{ $t('auth.lastName') }}</label>
              <InputText id="reg-lname" v-model="form.lastName" :placeholder="$t('auth.lastNamePlaceholder')" style="width:100%;" />
            </div>
          </div>

          <div class="cs-form-group">
            <label class="cs-form-label">{{ $t('auth.emailInvited') }}</label>
            <InputText id="reg-email" v-model="form.email" type="email" placeholder="correo@hospital.com" style="width:100%;" />
          </div>

          <div class="form-row">
            <div class="cs-form-group">
              <label class="cs-form-label">{{ $t('auth.workArea') }}</label>
              <InputText id="reg-area" v-model="form.workArea" :placeholder="$t('auth.workAreaPlaceholder')" style="width:100%;" />
            </div>
            <div class="cs-form-group">
              <label class="cs-form-label">{{ $t('common.specialty') }}</label>
              <InputText id="reg-specialty" v-model="form.specialty" :placeholder="$t('auth.specialtyPlaceholder')" style="width:100%;" />
            </div>
          </div>

          <div class="cs-form-group">
            <label class="cs-form-label">{{ $t('auth.newPassword') }}</label>
            <Password id="reg-pwd" v-model="form.password" toggleMask style="width:100%;" :inputStyle="{ width:'100%' }" />
          </div>

          <div class="cs-form-group">
            <label class="cs-form-label">{{ $t('auth.confirmPassword') }}</label>
            <Password id="reg-pwd2" v-model="form.confirmPassword" :feedback="false" toggleMask style="width:100%;" :inputStyle="{ width:'100%' }" />
            <small v-if="form.password && form.confirmPassword && form.password !== form.confirmPassword" class="cs-form-error">
              {{ $t('auth.passwordsNoMatch') }}
            </small>
          </div>

          <div v-if="registerError" class="cs-form-error-banner">
            <i class="pi pi-exclamation-circle"></i> {{ $t('auth.registerError') }}
          </div>

          <button type="submit" class="cs-btn cs-btn-primary cs-btn-full" :disabled="loading">
            <span v-if="loading" class="cs-spinner"></span>
            {{ loading ? $t('common.loading') : $t('auth.signUp') }}
          </button>
        </form>

        <p class="auth-form-footer" v-if="!success">
          {{ $t('auth.haveAccount') }}
          <RouterLink to="/auth/sign-in" class="auth-link">{{ $t('auth.loginLink') }}</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '../../application/auth.store.js'
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue'

const authStore = useAuthStore()

const form = reactive({
  firstName: '', lastName: '', email: '', workArea: '',
  specialty: '', password: '', confirmPassword: ''
})
const loading       = ref(false)
const registerError = ref(false)
const success       = ref(false)

async function handleRegister () {
  if (!form.email || !form.password || form.password !== form.confirmPassword) return

  loading.value      = true
  registerError.value = false

  try {
    await authStore.register(form)
    success.value = true
  } catch {
    registerError.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-layout { display: flex; min-height: 100vh; font-family: var(--cs-font-family); }

.auth-left {
  width: 40%;
  background: var(--bg-dark);
  display: flex; align-items: center; justify-content: center;
  padding: 3rem 2.5rem; position: relative;
}
.auth-left::after {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 80%, rgba(69,221,229,0.12) 0%, transparent 60%);
  pointer-events: none;
}
.auth-left-inner { position: relative; z-index: 1; max-width: 380px; width: 100%; }

.auth-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 2rem; }
.auth-brand-icon {
  width: 36px; height: 36px; background: var(--primary); color: var(--bg-dark);
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 800;
}
.auth-brand-name { font-size: 20px; font-weight: 800; color: #fff; }
.auth-hero-title { font-size: 24px; font-weight: 800; color: #fff; line-height: 1.25; margin-bottom: 1rem; }
.auth-hero-desc  { font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.7; margin-bottom: 2rem; }

.auth-info-box {
  display: flex; gap: 12px; align-items: flex-start;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; padding: 14px;
}
.auth-info-icon { font-size: 18px; flex-shrink: 0; }
.auth-info-text { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.6; }

.auth-right {
  flex: 1; background: var(--bg-surface, #f9fffe);
  display: flex; align-items: center; justify-content: center;
  padding: 2rem; position: relative;
}
.auth-lang-top { position: absolute; top: 1.5rem; right: 1.5rem; }
.auth-form-wrap { width: 100%; max-width: 480px; }
.auth-form-title { font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; }
.auth-form-subtitle { font-size: 13px; color: var(--text-muted); margin-bottom: 1.5rem; }
.auth-form { display: flex; flex-direction: column; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.auth-form-footer { margin-top: 1.5rem; text-align: center; font-size: 13px; color: var(--text-muted); }
.auth-link { color: var(--primary); font-weight: 700; text-decoration: none; }
.auth-link:hover { text-decoration: underline; }

.auth-success-banner {
  display: flex; align-items: center; gap: 8px;
  background: #F0FDF4; color: #15803D; border: 1px solid #A7F3D0;
  border-radius: 10px; padding: 14px 16px; font-size: 13px; margin-bottom: 16px;
}
.cs-form-error-banner {
  display: flex; align-items: center; gap: 8px;
  background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA;
  border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 14px;
}
.cs-spinner {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 6px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
