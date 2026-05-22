<!--
  @file app-topbar.vue
  @description Topbar alineado con la demo — saludo, subtítulo y lang switcher.
-->
<template>
  <header class="cs-topbar">
    <div>
      <div class="cs-topbar-greeting">{{ $t('common.greeting') }}, {{ authStore.user?.firstName }}</div>
      <div class="cs-topbar-subtitle">{{ subtitle }}</div>
    </div>
    <div class="cs-topbar-right">
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

const subtitle = computed(() => t('app.topbarSubtitle'))
</script>
