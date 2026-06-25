<template>
  <AuthLayout>
    <main class="auth-card">
      <div class="card-header">
        <h2>{{ $t('auth.welcome') }}</h2>
        <p>{{ $t('auth.subtitle') }} <strong>CortiSense</strong>.</p>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <div class="field">
          <label for="email">{{ $t('auth.email') }}</label>
          <div class="input-control">
            <i class="pi pi-envelope"></i>
            <input id="email" v-model.trim="form.email" type="email" :placeholder="$t('auth.email-placeholder')" autocomplete="email">
          </div>
        </div>

        <div class="field">
          <label for="password">{{ $t('auth.password') }}</label>
          <div class="input-control">
            <i class="pi pi-lock"></i>
            <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" :placeholder="$t('auth.password-placeholder')" autocomplete="current-password">
            <button class="password-toggle" type="button" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
        </div>

        <small v-if="errorMessage" class="field-error">{{ errorMessage }}</small>

        <button class="submit-button" type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? $t('auth.signing-in') : $t('auth.sign-in') }}
        </button>
      </form>

      <p class="register-message">{{ $t('auth.invitation-help') }}</p>
    </main>
  </AuthLayout>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../application/auth.store.js'
import { getDefaultRoute } from '../../../router.js'
import AuthLayout from '../../../shared/presentation/components/auth-layout.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })
const showPassword = ref(false)
const form = reactive({ email: '', password: '' })
const localError = ref('')
const errorMessage = computed(() => localError.value ? t(localError.value) : '')

async function submit () {
  localError.value = ''
  if (!form.email) { localError.value = 'auth.error.email-required'; return }
  if (!form.password) { localError.value = 'auth.error.password-required'; return }
  try {
    const user = await authStore.login(form)

    console.log('Rol Vue:', user.role)
    console.log('Rol API:', user.apiRole)
    console.log('Ruta destino:', getDefaultRoute(user.role))
    console.log('Ruta API destino:', getDefaultRoute(user.apiRole))

    router.push(getDefaultRoute(user.apiRole))
  } catch (error) {
    localError.value = error.message || 'auth.error.invalid-credentials'
  }
}
</script>
