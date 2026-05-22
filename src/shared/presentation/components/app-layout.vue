<!--
  @file app-layout.vue
  @description Layout interno principal de CortiSense.
  Compone el sidebar (según rol) + topbar + slot de contenido.
  Se activa cuando meta.layout === 'app' en app.vue.
-->
<template>
  <div class="app-layout">
    <AppSidebar :menu-items="menuItems" />

    <div class="app-main">
      <AppTopbar />
      <main class="app-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import AppSidebar from './app-sidebar.vue'
import AppTopbar from './app-topbar.vue'

const authStore = useAuthStore()

/** Menú del Administrador */
const adminMenu = [
  { key: 'dashboard',    icon: 'pi pi-home',        labelKey: 'nav.dashboard',    to: '/admin/dashboard'    },
  { key: 'staff',        icon: 'pi pi-users',        labelKey: 'nav.staff',        to: '/admin/staff/list'   },
  { key: 'invitations',  icon: 'pi pi-envelope',     labelKey: 'nav.invitations',  to: '/admin/invitations'  },
  { key: 'subscription', icon: 'pi pi-credit-card',  labelKey: 'nav.subscription', to: '/admin/subscription' },
  { key: 'reports',      icon: 'pi pi-chart-bar',    labelKey: 'nav.reports',      to: '/admin/reports'      },
  { key: 'audit',        icon: 'pi pi-history',      labelKey: 'nav.audit',        to: '/admin/audit'        },
  { key: 'settings',     icon: 'pi pi-cog',          labelKey: 'nav.settings',     to: '/admin/settings'     }
]

/** Menú del Supervisor Clínico */
const supervisorMenu = [
  { key: 'dashboard',         icon: 'pi pi-th-large',      labelKey: 'nav.shiftSummary',      to: '/supervisor/dashboard'          },
  { key: 'riskStaff',         icon: 'pi pi-exclamation-triangle', labelKey: 'nav.riskStaff',  to: '/supervisor/risk-staff'         },
  { key: 'alerts',            icon: 'pi pi-bell',          labelKey: 'nav.alerts',            to: '/supervisor/alerts'             },
  { key: 'anomalies',         icon: 'pi pi-chart-line',    labelKey: 'nav.anomalies',         to: '/supervisor/anomalies'          },
  { key: 'preventiveActions', icon: 'pi pi-shield',        labelKey: 'nav.preventiveActions', to: '/supervisor/preventive-actions' },
  { key: 'settings',          icon: 'pi pi-cog',           labelKey: 'nav.settings',          to: '/supervisor/settings'           }
]

/** Menú del Personal Médico */
const medicalStaffMenu = [
  { key: 'status',    icon: 'pi pi-heart',       labelKey: 'nav.myStatus',   to: '/medical-staff/status'    },
  { key: 'vitals',    icon: 'pi pi-chart-line',  labelKey: 'nav.myVitals',   to: '/medical-staff/vitals'    },
  { key: 'shifts',    icon: 'pi pi-calendar',    labelKey: 'nav.myShifts',   to: '/medical-staff/shifts'    },
  { key: 'recovery',  icon: 'pi pi-refresh',     labelKey: 'nav.myRecovery', to: '/medical-staff/recovery'  },
  { key: 'settings',  icon: 'pi pi-cog',         labelKey: 'nav.settings',   to: '/medical-staff/settings'  }
]

/**
 * Devuelve el menú correspondiente al rol del usuario autenticado.
 * @type {import('vue').ComputedRef<Array>}
 */
const menuItems = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return adminMenu
  if (role === 'clinical_supervisor') return supervisorMenu
  if (role === 'medical_staff') return medicalStaffMenu
  return []
})
</script>
