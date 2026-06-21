import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './iam/application/auth.store.js'

const route = (path, component, roles = [], layout = 'app') => ({
  path,
  component,
  meta: {
    requiresAuth: layout === 'app',
    roles,
    layout
  }
})

export function getDefaultRoute(role) {
  const routes = {
    admin: '/admin/dashboard',
    clinical_supervisor: '/supervisor/dashboard',
    medical_staff: '/doctor/health'
  }

  return routes[role] || '/sign-in'
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/sign-in' },
    { path: '/auth/sign-in', redirect: '/sign-in' },

    { path: '/medical-staff/status', redirect: '/doctor/health' },
    { path: '/medical-staff/vitals', redirect: '/doctor/vital-signs' },
    { path: '/medical-staff/shifts', redirect: '/doctor/shifts' },
    { path: '/medical-staff/recovery', redirect: '/doctor/recovery' },
    { path: '/medical-staff/settings', redirect: '/doctor/settings' },

    route('/sign-in', () => import('./iam/presentation/views/sign-in.view.vue'), [], 'public'),

    route('/accept-invitation', () => import('./iam/presentation/views/accept-invitation.view.vue'), [], 'public'),

    route('/onboarding/:planCode?', () => import('./subscription-plan-management/presentation/views/onboarding.view.vue'), [], 'public'),

    route('/register-organization/:planCode', () => import('./subscription-plan-management/presentation/views/organization-registration.view.vue'), [], 'public'),

    route('/checkout/success', () => import('./subscription-plan-management/presentation/views/checkout-success.view.vue'), [], 'public'),

    route('/checkout/cancelled', () => import('./subscription-plan-management/presentation/views/checkout-cancelled.view.vue'), [], 'public'),

    route('/admin/dashboard', () => import('./clinical-risk-assessment/presentation/views/admin-dashboard.view.vue'), ['admin']),
    route('/admin/staff', () => import('./iam/presentation/views/staff-management.view.vue'), ['admin']),
    route('/admin/staff/list', () => import('./iam/presentation/views/staff-management.view.vue'), ['admin']),
    route('/admin/invitations', () => import('./iam/presentation/views/invitation-management.view.vue'), ['admin']),
    route('/admin/teams', () => import('./shift-coordination/presentation/views/team-management.view.vue'), ['admin']),
    route('/admin/subscription', () => import('./subscription-plan-management/presentation/views/admin-subscription.view.vue'), ['admin']),
    route('/admin/reports', () => import('./audit-compliance/presentation/views/admin-reports.view.vue'), ['admin']),
    route('/admin/audit', () => import('./audit-compliance/presentation/views/admin-audit.view.vue'), ['admin']),
    route('/admin/settings', () => import('./iam/presentation/views/account-settings.view.vue'), ['admin']),

    route('/supervisor/dashboard', () => import('./clinical-risk-assessment/presentation/views/supervisor-dashboard.view.vue'), ['clinical_supervisor']),
    route('/supervisor/risk-staff', () => import('./clinical-risk-assessment/presentation/views/supervisor-risk-staff.view.vue'), ['clinical_supervisor']),
    route('/supervisor/clinical-alerts', () => import('./clinical-risk-assessment/presentation/views/supervisor-clinical-alerts.view.vue'), ['clinical_supervisor']),
    route('/supervisor/alerts', () => import('./clinical-risk-assessment/presentation/views/supervisor-clinical-alerts.view.vue'), ['clinical_supervisor']),
    route('/supervisor/anomalies', () => import('./clinical-risk-assessment/presentation/views/supervisor-anomalies.view.vue'), ['clinical_supervisor']),
    route('/supervisor/preventive-actions', () => import('./staff-recovery/presentation/views/preventive-actions-management.view.vue'), ['clinical_supervisor']),
    route('/supervisor/shifts', () => import('./shift-coordination/presentation/views/supervisor-shifts.view.vue'), ['clinical_supervisor']),
    route('/supervisor/settings', () => import('./iam/presentation/views/account-settings.view.vue'), ['clinical_supervisor']),

    route('/doctor/health', () => import('./clinical-risk-assessment/presentation/views/doctor-health-dashboard.view.vue'), ['medical_staff']),
    route('/doctor/vital-signs', () => import('./clinical-risk-assessment/presentation/views/doctor-vital-signs.view.vue'), ['medical_staff']),
    route('/doctor/shifts', () => import('./shift-coordination/presentation/views/doctor-shifts.view.vue'), ['medical_staff']),
    route('/doctor/recovery', () => import('./staff-recovery/presentation/views/doctor-recovery.view.vue'), ['medical_staff']),
    route('/doctor/settings', () => import('./iam/presentation/views/account-settings.view.vue'), ['medical_staff']),

    { path: '/:pathMatch(.*)*', redirect: '/sign-in' }
  ]
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    authStore.restoreSession()
  }

  if (!to.meta.requiresAuth) {
    if (authStore.isAuthenticated && to.path === '/sign-in') {
      return getDefaultRoute(authStore.userRole)
    }

    return true
  }

  if (!authStore.isAuthenticated) {
    return {
      path: '/sign-in',
      query: { redirect: to.fullPath }
    }
  }

  const allowedRoles = to.meta.roles || []

  if (allowedRoles.length > 0 && !allowedRoles.includes(authStore.userRole)) {
    return getDefaultRoute(authStore.userRole)
  }

  return true
})

export default router