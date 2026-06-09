<template>
  <div class="app-shell">
    <AppSidebar :menu-items="menuItems" />
    <main class="main-shell">
      <AppTopbar />
      <section class="page-content">
        <slot />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import AppSidebar from './app-sidebar.vue'
import AppTopbar from './app-topbar.vue'

const authStore = useAuthStore()

const adminMenu = [
  { key: 'dashboard', icon: 'pi pi-th-large', labelKey: 'nav.dashboard', to: '/admin/dashboard' },
  { key: 'staff', icon: 'pi pi-users', labelKey: 'nav.staff', to: '/admin/staff' },
  { key: 'teams', icon: 'pi pi-users', labelKey: 'nav.teams', to: '/admin/teams' },
  { key: 'invitations', icon: 'pi pi-envelope', labelKey: 'nav.invitations', to: '/admin/invitations' },
  { key: 'subscription', icon: 'pi pi-credit-card', labelKey: 'nav.subscription', to: '/admin/subscription' },
  { key: 'reports', icon: 'pi pi-chart-bar', labelKey: 'nav.reports', to: '/admin/reports' },
  { key: 'audit', icon: 'pi pi-history', labelKey: 'nav.audit', to: '/admin/audit' },
  { key: 'settings', icon: 'pi pi-cog', labelKey: 'nav.settings', to: '/admin/settings' }
]

const supervisorMenu = [
  { key: 'dashboard', icon: 'pi pi-th-large', labelKey: 'nav.shiftSummary', to: '/supervisor/dashboard' },
  { key: 'risk', icon: 'pi pi-exclamation-triangle', labelKey: 'nav.riskStaff', to: '/supervisor/risk-staff' },
  { key: 'alerts', icon: 'pi pi-bell', labelKey: 'nav.clinicalAlerts', to: '/supervisor/clinical-alerts' },
  { key: 'anomalies', icon: 'pi pi-chart-line', labelKey: 'nav.anomalies', to: '/supervisor/anomalies' },
  { key: 'preventive', icon: 'pi pi-shield', labelKey: 'nav.preventiveActions', to: '/supervisor/preventive-actions' },
  { key: 'shifts', icon: 'pi pi-calendar', labelKey: 'nav.shifts', to: '/supervisor/shifts' },
  { key: 'settings', icon: 'pi pi-cog', labelKey: 'nav.settings', to: '/supervisor/settings' }
]

const doctorMenu = [
  { key: 'health', icon: 'pi pi-heart', labelKey: 'nav.myStatus', to: '/doctor/health' },
  { key: 'vitals', icon: 'pi pi-chart-line', labelKey: 'nav.myVitals', to: '/doctor/vital-signs' },
  { key: 'shifts', icon: 'pi pi-calendar', labelKey: 'nav.myShifts', to: '/doctor/shifts' },
  { key: 'recovery', icon: 'pi pi-refresh', labelKey: 'nav.myRecovery', to: '/doctor/recovery' },
  { key: 'settings', icon: 'pi pi-cog', labelKey: 'nav.settings', to: '/doctor/settings' }
]

const menuItems = computed(() => {
  if (authStore.userRole === 'admin') return adminMenu
  if (authStore.userRole === 'clinical_supervisor') return supervisorMenu
  if (authStore.userRole === 'medical_staff') return doctorMenu
  return []
})
</script>
