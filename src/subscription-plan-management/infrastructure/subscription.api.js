import { listResource, patchResource } from '../../shared/infrastructure/api.service.js'
import { http, publicHttp } from '../../shared/infrastructure/http.js'

const PENDING_CHECKOUT_KEY = 'cortisense_pending_checkout'

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function readField(source, camelName, pascalName = null) {
  return source?.[camelName] ?? source?.[pascalName ?? camelName]
}

function unwrapCandidates(resource) {
  return [
    resource,
    resource?.data,
    resource?.user,
    resource?.User,
    resource?.organization,
    resource?.Organization,
    resource?.subscription,
    resource?.Subscription,
    resource?.checkoutSession,
    resource?.CheckoutSession
  ].filter(Boolean)
}

function extractId(resource) {
  for (const candidate of unwrapCandidates(resource)) {
    const id = readField(candidate, 'id', 'Id')

    if (id !== undefined && id !== null && id !== '') {
      return Number(id)
    }
  }

  return null
}

function ensureId(resource, fallbackMessage) {
  const id = extractId(resource)

  if (!id || Number.isNaN(id)) {
    throw new Error(fallbackMessage)
  }

  return id
}

function normalizePlanCode(plan) {
  return String(plan?.code || plan?.Code || '').trim().toLowerCase()
}

function normalizeCheckoutResponse(resource = {}) {
  const data = resource?.checkoutSession ?? resource?.CheckoutSession ?? resource

  return {
    checkoutUrl:
      readField(data, 'checkoutUrl', 'CheckoutUrl') ||
      readField(data, 'url', 'Url') ||
      '',

    stripeSessionId:
      readField(data, 'stripeSessionId', 'StripeSessionId') ||
      readField(data, 'sessionId', 'SessionId') ||
      '',

    checkoutSessionId:
      readField(data, 'checkoutSessionId', 'CheckoutSessionId') ||
      readField(data, 'id', 'Id') ||
      null,

    organizationId: readField(data, 'organizationId', 'OrganizationId') || null,
    administratorId: readField(data, 'administratorId', 'AdministratorId') || null,
    subscriptionId: readField(data, 'subscriptionId', 'SubscriptionId') || null
  }
}

function savePendingCheckout(payload) {
  sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(payload))
}

function readPendingCheckout() {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_CHECKOUT_KEY) || 'null')
  } catch {
    return null
  }
}

function clearPendingCheckout() {
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
}

function getBackendMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.response?.data?.title ||
    error?.message ||
    ''
  )
}

function mapBackendError(error, fallbackKey) {
  const message = getBackendMessage(error)
  const status = error?.response?.status

  const dictionary = {
    OrganizationEmailAlreadyExists: 'subscription.registration.error.organization-email-already-exists',
    OrganizationRucAlreadyExists: 'subscription.registration.error.ruc-already-exists',
    UserEmailAlreadyExists: 'subscription.registration.error.admin-email-already-exists',
    PlanNotFound: 'subscription.registration.error.plan-not-found',
    SubscriptionNotFound: 'subscription.registration.error.subscription-create-failed',
    StripeSecretKeyNotConfigured: 'subscription.registration.error.stripe-not-configured'
  }

  if (dictionary[message]) {
    return dictionary[message]
  }

  if (status === 401 || status === 403) {
    return 'subscription.registration.error.checkout-create-failed'
  }

  if (message.includes('STRIPE_SECRET_KEY') || message.includes('Stripe')) {
    return 'subscription.registration.error.stripe-not-configured'
  }

  return fallbackKey
}

async function runRequest(operation, fallbackKey) {
  try {
    return await operation()
  } catch (error) {
    throw new Error(mapBackendError(error, fallbackKey))
  }
}

export const subscriptionApi = {
  plans() {
    return publicHttp.get('/plans', {
      skipAuthRedirect: true
    }).then(response => response.data)
  },

  subscriptions: (params = {}) => listResource('subscriptions', params),

  checkoutSessions: (params = {}) => listResource('checkoutSessions', params),

  organizations: () => listResource('organizations'),

  getPendingCheckout: readPendingCheckout,

  clearPendingCheckout,

  createOrganization(payload) {
    return runRequest(
      () => publicHttp.post('/organizations', {
        name: payload.name,
        ruc: payload.ruc,
        email: normalizeEmail(payload.email),
        phone: payload.phone,
        address: payload.address,
        status: payload.status || 'ACTIVE',
        registrationStatus: payload.registrationStatus || 'COMPLETED'
      }, {
        skipAuthRedirect: true
      }).then(response => response.data),
      'subscription.registration.error.organization-create-failed'
    )
  },

  createHospitalAdministrator(payload) {
    return runRequest(
      () => publicHttp.post('/authentication/sign-up', {
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
      }, {
        skipAuthRedirect: true
      }).then(response => response.data),
      'subscription.registration.error.admin-create-failed'
    )
  },

  createSubscription(payload) {
    return runRequest(
      () => publicHttp.post('/subscriptions', {
        organizationId: payload.organizationId,
        planId: payload.planId,
        startedAt: payload.startedAt || null
      }, {
        skipAuthRedirect: true
      }).then(response => response.data),
      'subscription.registration.error.subscription-create-failed'
    )
  },

  updateSubscription: (id, payload) => patchResource('subscriptions', id, payload),

  createStripeCheckoutSession(payload) {
    return runRequest(
      () => publicHttp.post('/billing/create-checkout-session', {
        organizationId: payload.organizationId,
        administratorId: payload.administratorId,
        subscriptionId: payload.subscriptionId,
        planId: payload.planId,
        planCode: payload.planCode,
        customerEmail: normalizeEmail(payload.customerEmail)
      }, {
        skipAuthRedirect: true
      }).then(response => normalizeCheckoutResponse(response.data)),
      'subscription.registration.error.checkout-create-failed'
    )
  },

  getCheckoutSessionStatus(stripeSessionId) {
    return publicHttp.get(
      `/billing/checkout-session-status?session_id=${encodeURIComponent(stripeSessionId)}`,
      {
        skipAuthRedirect: true
      }
    ).then(response => response.data)
  },

  cancelCheckoutSession(checkoutSessionId) {
    return publicHttp.post('/billing/cancel-checkout-session', {
      checkoutSessionId: Number(checkoutSessionId)
    }, {
      skipAuthRedirect: true
    }).then(response => response.data)
  },

  async registerOrganizationWithStripe({ plan, organization, administrator }) {
    const createdOrganization = await this.createOrganization({
      ...organization,
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
      planCode: normalizePlanCode(plan),
      customerEmail: administrator.email
    })

    if (!checkoutSession.checkoutUrl) {
      throw new Error('subscription.registration.error.checkout-create-failed')
    }

    savePendingCheckout({
      planCode: normalizePlanCode(plan),
      organizationId,
      administratorId,
      subscriptionId,
      checkoutSessionId: checkoutSession.checkoutSessionId,
      stripeSessionId: checkoutSession.stripeSessionId,
      customerEmail: normalizeEmail(administrator.email),
      createdAt: new Date().toISOString()
    })

    return {
      organization: createdOrganization,
      administrator: createdAdministrator,
      subscription: createdSubscription,
      checkoutSession
    }
  }
}