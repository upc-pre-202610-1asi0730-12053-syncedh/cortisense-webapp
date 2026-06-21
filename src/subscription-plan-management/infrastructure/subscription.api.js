import { createResource, listResource, patchResource } from '../../shared/infrastructure/api.service.js'
import { http } from '../../shared/infrastructure/http.js'

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function readField(source, camelName, pascalName = null) {
  return source?.[camelName] ?? source?.[pascalName ?? camelName]
}

function ensureId(resource, fallbackMessage) {
  const id = readField(resource, 'id', 'Id')

  if (!id) throw new Error(fallbackMessage)

  return Number(id)
}

export const subscriptionApi = {
  plans: () => listResource('plans'),

  subscriptions: (params = {}) => listResource('subscriptions', params),

  checkoutSessions: (params = {}) => listResource('checkoutSessions', params),

  organizations: () => listResource('organizations'),

  createOrganization: payload => createResource('organizations', {
    name: payload.name,
    ruc: payload.ruc,
    email: normalizeEmail(payload.email),
    phone: payload.phone,
    address: payload.address,
    status: payload.status || 'ACTIVE',
    registrationStatus: payload.registrationStatus || 'COMPLETED'
  }),

  createHospitalAdministrator: payload => http.post('/authentication/sign-up', {
    organizationId: payload.organizationId,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: normalizeEmail(payload.email),
    password: payload.password,
    role: 'HOSPITAL_ADMIN',
    status: payload.status || 'ACTIVE',
    phone: payload.phone,
    workAreaId: null,
    specialtyId: null,
    registrationStatus: payload.registrationStatus || 'COMPLETED'
  }).then(response => response.data),

  createSubscription: payload => createResource('subscriptions', {
    organizationId: payload.organizationId,
    planId: payload.planId,
    startedAt: payload.startedAt || null
  }),

  updateSubscription: (id, payload) => patchResource('subscriptions', id, payload),

  createCheckoutSession: payload => createResource('checkoutSessions', payload),

  createStripeCheckoutSession: payload => http.post('/billing/create-checkout-session', {
    organizationId: payload.organizationId,
    administratorId: payload.administratorId,
    subscriptionId: payload.subscriptionId,
    planId: payload.planId,
    planCode: payload.planCode,
    customerEmail: normalizeEmail(payload.customerEmail)
  }).then(response => response.data),

  getCheckoutSessionStatus: stripeSessionId => http.get(
    `/billing/checkout-session-status?session_id=${encodeURIComponent(stripeSessionId)}`
  ).then(response => response.data),

  cancelCheckoutSession: checkoutSessionId => http.post('/billing/cancel-checkout-session', {
    checkoutSessionId: Number(checkoutSessionId)
  }).then(response => response.data),

  async registerOrganizationWithStripe({ plan, organization, administrator }) {
    const createdOrganization = await this.createOrganization({
      ...organization,
      email: administrator.email,
      status: 'ACTIVE',
      registrationStatus: 'COMPLETED'
    })

    const organizationId = ensureId(
      createdOrganization,
      'subscription.registration.error.organization-create-failed'
    )

    const createdAdministrator = await this.createHospitalAdministrator({
      ...administrator,
      organizationId,
      status: 'ACTIVE',
      registrationStatus: 'COMPLETED'
    })

    const administratorId = ensureId(
      createdAdministrator,
      'subscription.registration.error.admin-create-failed'
    )

    const createdSubscription = await this.createSubscription({
      organizationId,
      planId: plan.id,
      startedAt: null
    })

    const subscriptionId = ensureId(
      createdSubscription,
      'subscription.registration.error.subscription-create-failed'
    )

    const checkoutSession = await this.createStripeCheckoutSession({
      organizationId,
      administratorId,
      subscriptionId,
      planId: plan.id,
      planCode: plan.code,
      customerEmail: administrator.email
    })

    if (!checkoutSession?.checkoutUrl) {
      throw new Error('subscription.registration.error.checkout-create-failed')
    }

    return {
      organization: createdOrganization,
      administrator: createdAdministrator,
      subscription: createdSubscription,
      checkoutSession
    }
  }
}