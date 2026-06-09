<template>
  <header class="topbar">
    <div class="topbar-title">
      <h1>{{ greeting }}</h1>
    </div>
    <div class="topbar-actions">
      <LanguageSwitcher />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import LanguageSwitcher from './language-switcher.vue'

const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })
const greeting = computed(() => {
  const name = authStore.user?.firstName || authStore.user?.fullName || 'usuario'
  if (authStore.userRole === 'admin') return t('layout.topbar.greetings.admin.review-operation', { name })
  if (authStore.userRole === 'clinical_supervisor') return t('layout.topbar.greetings.supervisor.review-team', { name })
  if (authStore.userRole === 'medical_staff') return t('layout.topbar.greetings.doctor.how-is-shift', { name })
  return t('layout.topbar.greetings.default.hello', { name })
})
</script>
