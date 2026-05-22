/**
 * @file routes.js
 * @description Rutas del bounded context Identity & Access Management (IAM).
 * Incluye rutas públicas de autenticación y rutas protegidas de gestión de personal.
 */

export default [
  // ── Rutas públicas (sin layout interno) ──────────────────
  {
    path: '/auth/sign-in',
    name: 'sign-in',
    component: () => import('./views/sign-in.view.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/auth/sign-up',
    name: 'sign-up',
    component: () => import('./views/sign-up.view.vue'),
    meta: { requiresAuth: false }
  }
]
