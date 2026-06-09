import { listResource, createResource, patchResource } from '../../shared/infrastructure/api.service.js'

export const subscriptionApi = {
  plans: () => listResource('plans'),
  subscriptions: () => listResource('subscriptions'),
  checkoutSessions: () => listResource('checkoutSessions'),
  organizations: () => listResource('organizations'),
  createOrganization: payload => createResource('organizations', payload),
  createSubscription: payload => createResource('subscriptions', payload),
  updateSubscription: (id, payload) => patchResource('subscriptions', id, payload),
  createCheckoutSession: payload => createResource('checkoutSessions', payload)
}
