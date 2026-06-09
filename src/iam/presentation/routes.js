export default [
  { path: '/sign-in', component: () => import('./views/sign-in.view.vue'), meta: { layout: 'auth' } },
  { path: '/accept-invitation', component: () => import('./views/accept-invitation.view.vue'), meta: { layout: 'auth' } }
]
