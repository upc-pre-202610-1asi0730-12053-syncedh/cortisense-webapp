<template>
  <aside class="sidebar">
    <div class="brand-section">
      <img src="/logo.svg" alt="CortiSense logo" class="brand-logo">
      <div>
        <h1>CortiSense</h1>
      </div>
    </div>

    <div class="profile-section">
      <div class="avatar" :style="{ background: avatarColor }">
        {{ userInitials }}
      </div>

      <div class="profile-info">
        <h2>{{ authStore.user?.fullName }}</h2>
        <p>{{ authStore.user?.email }}</p>
      </div>
    </div>

    <nav class="navigation">
      <p class="menu-title">{{ menuTitle }}</p>

      <RouterLink
          v-for="item in visibleMenuItems"
          :key="item.key"
          :to="item.to"
          class="nav-item"
          active-class="active"
      >
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { initials, listResource } from '../../infrastructure/api.service.js'

const props = defineProps({
  menuItems: {
    type: Array,
    required: true
  }
})

const authStore = useAuthStore()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })

const plans = ref([])
const subscriptions = ref([])

const orgId = computed(() => Number(authStore.user?.organizationId || 1))

const currentSubscription = computed(() =>
    subscriptions.value.find(subscription =>
        Number(subscription.organizationId) === orgId.value
    )
)

const currentPlan = computed(() =>
    plans.value.find(plan =>
        Number(plan.id) === Number(currentSubscription.value?.planId)
    )
)

const currentPlanCode = computed(() => {
  const rawValue = currentPlan.value?.code || currentPlan.value?.name || ''
  const value = String(rawValue).toUpperCase()

  if (value.includes('BASIC')) return 'BASIC'
  if (value.includes('PROFESSIONAL')) return 'PROFESSIONAL'
  if (value.includes('ENTERPRISE')) return 'ENTERPRISE'

  return 'BASIC'
})

const isBasicPlan = computed(() => currentPlanCode.value === 'BASIC')

const visibleMenuItems = computed(() => {
  if (!isBasicPlan.value) return props.menuItems

  return props.menuItems.filter(item => !isPremiumMenuItem(item))
})

const userInitials = computed(() => initials(authStore.user))

const avatarColor = computed(() =>
    'linear-gradient(135deg, #45DDE5, #95FFFD)'
)

const menuTitle = computed(() => {
  if (authStore.userRole === 'admin') return t('app.adminMenu')
  if (authStore.userRole === 'clinical_supervisor') return t('app.supervisorMenu')
  return t('app.staffMenu')
})

onMounted(() => {
  loadSubscriptionContext()
  window.addEventListener('subscription-plan-updated', loadSubscriptionContext)
})

onBeforeUnmount(() => {
  window.removeEventListener('subscription-plan-updated', loadSubscriptionContext)
})

async function loadSubscriptionContext () {
  try {
    ;[plans.value, subscriptions.value] = await Promise.all([
      listResource('plans'),
      listResource('subscriptions')
    ])
  } catch (error) {
    console.error('Error loading subscription context for sidebar:', error)
  }
}

function isPremiumMenuItem (item) {
  const text = `${item.key || ''} ${item.to || ''} ${item.labelKey || ''}`.toLowerCase()

  return (
      text.includes('report') ||
      text.includes('reporte') ||
      text.includes('audit') ||
      text.includes('auditor')
  )
}

function signOut () {
  authStore.logout()
  router.push('/sign-in')
}
</script>