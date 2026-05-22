<!--
  @file logout-button.vue
  @description Botón de cierre de sesión.
  Llama a authStore.logout() y redirige a /auth/sign-in.
-->
<template>
  <button class="cs-logout-btn" @click="handleLogout">
    <i class="pi pi-sign-out"></i>
    <span>{{ $t('common.logout') }}</span>
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../iam/application/auth.store.js'

const router = useRouter()
const authStore = useAuthStore()

/**
 * Ejecuta el logout y redirige al sign-in.
 */
function handleLogout () {
  authStore.logout()
  router.push('/auth/sign-in')
}
</script>

<style scoped>
.cs-logout-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.7rem 0.9rem;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.875rem;
  font-weight: 500;
  font-family: var(--cs-font-family);
  cursor: pointer;
  transition: all 0.2s;
}
.cs-logout-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
.cs-logout-btn i { font-size: 1rem; }
</style>
