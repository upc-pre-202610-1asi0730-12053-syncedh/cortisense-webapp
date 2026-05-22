<!--
  @file sign-in.view.vue
  @description Login de CortiSense — layout dividido fiel a la demo.
  - Panel izquierdo: branding centrado + demo de credenciales
  - Panel derecho: formulario
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
        <h1 class="auth-hero-title">{{ $t('auth.heroTitle') }}</h1>
        <p class="auth-hero-desc">{{ $t('auth.heroDesc') }}</p>

        <div class="auth-demo-box">
          <div class="auth-demo-label">{{ $t('auth.demoCredentials') }}</div>
          <div class="auth-demo-item">
            <span class="auth-demo-muted">admin@cortisense.com</span>
            <span class="auth-demo-sep">·</span>
            <span class="auth-demo-value">admin123</span>
          </div>
          <div class="auth-demo-item">
            <span class="auth-demo-muted">supervisor@cortisense.com</span>
            <span class="auth-demo-sep">·</span>
            <span class="auth-demo-value">supervisor123</span>
          </div>
          <div class="auth-demo-item">
            <span class="auth-demo-muted">doctor@cortisense.com</span>
            <span class="auth-demo-sep">·</span>
            <span class="auth-demo-value">doctor123</span>
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
        <h2 class="auth-form-title">{{ $t('auth.signIn') }}</h2>
        <p class="auth-form-subtitle">
          {{ $t('auth.loginSubtitle') }}
        </p>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="cs-form-group">
            <label class="cs-form-label">{{ $t('auth.email') }}</label>
            <InputText
              id="sign-in-email"
              v-model="form.email"
              type="email"
              :placeholder="$t('auth.emailPlaceholder')"
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
            />
            <small v-if="errors.email" class="cs-form-error">{{ $t('common.invalidEmail') }}</small>
          </div>

          <div class="cs-form-group">
            <label class="cs-form-label">{{ $t('auth.password') }}</label>
            <Password
              id="sign-in-password"
              v-model="form.password"
              :feedback="false"
              toggleMask
              class="w-full"
              :inputStyle="{ width: '100%' }"
              :placeholder="$t('auth.passwordPlaceholder')"
            />
            <small v-if="errors.password" class="cs-form-error">{{ $t('common.required') }}</small>
          </div>

          <div v-if="loginError" class="cs-form-error-banner">
            <i class="pi pi-exclamation-circle"></i> {{ $t('auth.loginError') }}
          </div>

          <button type="submit" class="cs-btn cs-btn-primary cs-btn-full" :disabled="loading">
            <span v-if="loading" class="cs-spinner"></span>
            {{ loading ? $t('common.loading') : $t('auth.signIn') }}
          </button>
        </form>

        <p class="auth-form-footer">
          {{ $t('auth.noAccount') }}
          <RouterLink to="/auth/sign-up" class="auth-link">{{ $t('auth.registerLink') }}</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../application/auth.store.js'
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue'

const router    = useRouter()
const authStore = useAuthStore()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: false, password: false })
const loading    = ref(false)
const loginError = ref(false)

async function handleLogin () {
  errors.email    = !form.email || !form.email.includes('@')
  errors.password = !form.password
  if (errors.email || errors.password) return

  loading.value    = true
  loginError.value = false

  try {
    const user = await authStore.login({ email: form.email, password: form.password })
    const roleRoutes = {
      admin:               '/admin/dashboard',
      clinical_supervisor: '/supervisor/dashboard',
      medical_staff:       '/medical-staff/status'
    }
    await router.push(roleRoutes[user.role] || '/admin/dashboard')
  } catch {
    loginError.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-layout {
  display: flex;
  min-height: 100vh;
  font-family: var(--cs-font-family);
}

/* ── Panel izquierdo ─────────────────────────── */
.auth-left {
  width: 42%;
  background: var(--bg-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2.5rem;
  position: relative;
}
.auth-left::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 80%, rgba(69,221,229,0.12) 0%, transparent 60%);
  pointer-events: none;
}
.auth-left-inner {
  position: relative;
  z-index: 1;
  max-width: 380px;
  width: 100%;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 2rem;
}
.auth-brand-icon {
  width: 36px; height: 36px;
  background: var(--primary);
  color: var(--bg-dark);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 800;
}
.auth-brand-name {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
}

.auth-hero-title {
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  line-height: 1.25;
  margin-bottom: 1rem;
}
.auth-hero-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.55);
  line-height: 1.7;
  margin-bottom: 2rem;
}

/* ── Demo box ────────────────────────────────── */
.auth-demo-box {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 16px 20px;
}
.auth-demo-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 10px;
}
.auth-demo-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 12px;
}
.auth-demo-item:last-child { margin-bottom: 0; }
.auth-demo-muted { color: rgba(255,255,255,0.5); }
.auth-demo-sep   { color: rgba(255,255,255,0.3); }
.auth-demo-value { color: var(--primary); font-weight: 700; }

/* ── Panel derecho ───────────────────────────── */
.auth-right {
  flex: 1;
  background: var(--bg-surface, #f9fffe);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
}
.auth-lang-top {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
}
.auth-form-wrap { width: 100%; max-width: 400px; }
.auth-form-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 6px;
}
.auth-form-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 2rem;
}
.auth-form { display: flex; flex-direction: column; gap: 0; }
.auth-form-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}
.auth-link {
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
}
.auth-link:hover { text-decoration: underline; }

.cs-form-error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FEF2F2;
  color: #991B1B;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 14px;
}

.cs-spinner {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 6px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.w-full { width: 100%; }
</style>
