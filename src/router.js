/**
 * @file router.js
 * @description Router central de CortiSense.
 * Importa rutas de cada bounded context.
 * Aplica guards de autenticación y autorización por rol.
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './iam/application/auth.store.js'

// ── Rutas por bounded context ─────────────────────────────
import iamRoutes from './iam/presentation/routes.js'

// Rutas placeholder — se reemplazarán en Fase 2 y 3
const placeholderRoutes = [
  // Admin
  { path: '/admin/dashboard',    component: () => import('./audit-compliance/presentation/views/admin-dashboard.view.vue'),   meta: { requiresAuth: true, roles: ['admin'],                layout: 'app' } },
  { path: '/admin/staff/list',   component: () => import('./iam/presentation/views/admin-staff-list.view.vue'),              meta: { requiresAuth: true, roles: ['admin'],                layout: 'app' } },
  { path: '/admin/staff/new',    component: () => import('./iam/presentation/views/admin-staff-new.view.vue'),               meta: { requiresAuth: true, roles: ['admin'],                layout: 'app' } },
  { path: '/admin/staff/:id',    component: () => import('./iam/presentation/views/admin-staff-detail.view.vue'),            meta: { requiresAuth: true, roles: ['admin'],                layout: 'app' } },
  { path: '/admin/staff/:id/edit', component: () => import('./iam/presentation/views/admin-staff-edit.view.vue'),            meta: { requiresAuth: true, roles: ['admin'],                layout: 'app' } },
  { path: '/admin/invitations',  component: () => import('./iam/presentation/views/admin-invitations.view.vue'),             meta: { requiresAuth: true, roles: ['admin'],                layout: 'app' } },
  { path: '/admin/subscription', component: () => import('./subscriptions/presentation/views/admin-subscription.view.vue'),  meta: { requiresAuth: true, roles: ['admin'],                layout: 'app' } },
  { path: '/admin/reports',      component: () => import('./audit-compliance/presentation/views/admin-reports.view.vue'),    meta: { requiresAuth: true, roles: ['admin'],                layout: 'app' } },
  { path: '/admin/audit',        component: () => import('./audit-compliance/presentation/views/admin-audit.view.vue'),      meta: { requiresAuth: true, roles: ['admin'],                layout: 'app' } },
  { path: '/admin/settings',     component: () => import('./iam/presentation/views/account-settings.view.vue'),              meta: { requiresAuth: true, roles: ['admin'],                layout: 'app' } },

  // Supervisor
  { path: '/supervisor/dashboard',         component: () => import('./incident-alert-management/presentation/views/supervisor-dashboard.view.vue'),         meta: { requiresAuth: true, roles: ['clinical_supervisor'], layout: 'app' } },
  { path: '/supervisor/risk-staff',        component: () => import('./clinical-risk/presentation/views/supervisor-risk-staff.view.vue'),                    meta: { requiresAuth: true, roles: ['clinical_supervisor'], layout: 'app' } },
  { path: '/supervisor/alerts',            component: () => import('./incident-alert-management/presentation/views/supervisor-alerts.view.vue'),             meta: { requiresAuth: true, roles: ['clinical_supervisor'], layout: 'app' } },
  { path: '/supervisor/anomalies',         component: () => import('./clinical-risk/presentation/views/supervisor-anomalies.view.vue'),                     meta: { requiresAuth: true, roles: ['clinical_supervisor'], layout: 'app' } },
  { path: '/supervisor/preventive-actions',component: () => import('./incident-alert-management/presentation/views/supervisor-preventive-actions.view.vue'),meta: { requiresAuth: true, roles: ['clinical_supervisor'], layout: 'app' } },
  { path: '/supervisor/settings',          component: () => import('./iam/presentation/views/account-settings.view.vue'),                                    meta: { requiresAuth: true, roles: ['clinical_supervisor'], layout: 'app' } },

  // Medical Staff
  { path: '/medical-staff/status',   component: () => import('./clinical-risk/presentation/views/medical-staff-status.view.vue'),   meta: { requiresAuth: true, roles: ['medical_staff'], layout: 'app' } },
  { path: '/medical-staff/vitals',   component: () => import('./clinical-risk/presentation/views/medical-staff-vitals.view.vue'),   meta: { requiresAuth: true, roles: ['medical_staff'], layout: 'app' } },
  { path: '/medical-staff/shifts',   component: () => import('./shift-coordination/presentation/views/medical-staff-shifts.view.vue'), meta: { requiresAuth: true, roles: ['medical_staff'], layout: 'app' } },
  { path: '/medical-staff/recovery', component: () => import('./staff-recovery/presentation/views/medical-staff-recovery.view.vue'),  meta: { requiresAuth: true, roles: ['medical_staff'], layout: 'app' } },
  { path: '/medical-staff/settings', component: () => import('./iam/presentation/views/account-settings.view.vue'),                   meta: { requiresAuth: true, roles: ['medical_staff'], layout: 'app' } }
]

/** Devuelve la ruta predeterminada según el rol del usuario. */
function getDefaultRoute (role) {
  const map = {
    admin:               '/admin/dashboard',
    clinical_supervisor: '/supervisor/dashboard',
    medical_staff:       '/medical-staff/status'
  }
  return map[role] || '/auth/sign-in'
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/auth/sign-in' },
    ...iamRoutes,
    ...placeholderRoutes,
    { path: '/:pathMatch(.*)*', redirect: '/auth/sign-in' }
  ]
})

/**
 * Guard global de navegación.
 * Verifica autenticación y autorización por rol.
 * Usa return value en lugar de next() para compatibilidad con Vue Router v4.
 */
router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    authStore.restoreSession()
  }

  const isPublic = !to.meta.requiresAuth
  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.userRole

  if (isPublic) {
    if (isAuthenticated && to.path.startsWith('/auth/')) {
      return getDefaultRoute(userRole)
    }
    return true
  }

  if (!isAuthenticated) {
    return '/auth/sign-in'
  }

  if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    return getDefaultRoute(userRole)
  }

  return true
})

export { getDefaultRoute }
export default router
