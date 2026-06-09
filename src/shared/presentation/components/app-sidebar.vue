<template>
  <aside class="sidebar">
    <div class="brand-section">
      <img src="/logo.svg" alt="CortiSense logo" class="brand-logo">
      <div><h1>CortiSense</h1></div>
    </div>

    <div class="profile-section">
      <div class="avatar" :style="{ background: avatarColor }">{{ userInitials }}</div>
      <div class="profile-info">
        <h2>{{ authStore.user?.fullName }}</h2>
        <p>{{ authStore.user?.email }}</p>
      </div>
    </div>

    <nav class="navigation">
      <p class="menu-title">{{ menuTitle }}</p>
      <RouterLink v-for="item in menuItems" :key="item.key" :to="item.to" class="nav-item" active-class="active">
        <i :class="item.icon"></i>
        <span>{{ $t(item.labelKey) }}</span>
      </RouterLink>
    </nav>

    <button type="button" class="sign-out-button" @click="signOut">
      <i class="pi pi-sign-out"></i>
      <span>{{ $t('nav.signOut') }}</span>
    </button>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { initials } from '../../infrastructure/api.service.js'

defineProps({ menuItems: { type: Array, required: true } })
const authStore = useAuthStore()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })

const userInitials = computed(() => initials(authStore.user))
const avatarColor = computed(() => 'linear-gradient(135deg, #45DDE5, #95FFFD)')
const menuTitle = computed(() => {
  if (authStore.userRole === 'admin') return t('app.adminMenu')
  if (authStore.userRole === 'clinical_supervisor') return t('app.supervisorMenu')
  return t('app.staffMenu')
})

function signOut () {
  authStore.logout()
  router.push('/sign-in')
}
</script>
