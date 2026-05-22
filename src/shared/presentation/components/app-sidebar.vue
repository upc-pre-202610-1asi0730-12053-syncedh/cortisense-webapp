<!--
  @file app-sidebar.vue
  @description Sidebar de CortiSense — alineado con la demo visual.
  Incluye logo, info del usuario autenticado, menú por rol y logout.
-->
<template>
  <aside class="cs-sidebar">
    <!-- Logo -->
    <div class="cs-sidebar-logo">
      <div class="cs-sidebar-brand-icon">+</div>
      <div>
        <div class="cs-sidebar-brand">CortiSense</div>
        <div class="cs-sidebar-tagline">{{ $t('app.sidebarTagline') }}</div>
      </div>
    </div>

    <!-- Usuario autenticado -->
    <div class="cs-sidebar-user">
      <div class="cs-avatar" :style="avatarStyle">{{ initials }}</div>
      <div>
        <div class="cs-sidebar-user-name">{{ authStore.user?.fullName }}</div>
        <div class="cs-sidebar-user-email">{{ authStore.user?.email }}</div>
      </div>
    </div>

    <!-- Label de menú -->
    <div class="cs-sidebar-menu-label">{{ menuLabel }}</div>

    <!-- Navegación -->
    <nav class="cs-sidebar-nav">
      <RouterLink
        v-for="item in menuItems"
        :key="item.key"
        :to="item.to"
        class="cs-nav-item"
        active-class="active"
      >
        <i :class="item.icon"></i>
        <span>{{ $t(item.labelKey) }}</span>
      </RouterLink>
    </nav>

    <!-- Logout -->
    <div class="cs-sidebar-footer">
      <LogoutButton />
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import LogoutButton from './logout-button.vue'

const { t } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()

defineProps({
  menuItems: { type: Array, required: true }
})

const avatarColors = ['#F97316', '#10B981', '#EF4444', '#45DDE5', '#F59E0B', '#8B5CF6']

const initials = computed(() => {
  const f = authStore.user?.firstName?.[0] || ''
  const l = authStore.user?.lastName?.[0] || ''
  return (f + l).toUpperCase()
})

const avatarStyle = computed(() => {
  const hash = (authStore.user?.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return { background: avatarColors[hash % avatarColors.length] }
})

const menuLabel = computed(() => {
  const role = authStore.userRole
  if (role === 'admin') return t('app.adminMenu')
  if (role === 'clinical_supervisor') return t('app.supervisorMenu')
  return t('app.staffMenu')
})
</script>
