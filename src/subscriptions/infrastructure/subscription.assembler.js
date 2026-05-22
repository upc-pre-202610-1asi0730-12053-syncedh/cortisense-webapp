/**
 * @file subscription.assembler.js
 * @description Ensamblador para suscripciones y planes.
 */
import { Subscription } from '../domain/model/subscription.entity.js'
import { Plan } from '../domain/model/plan.entity.js'

export const SubscriptionAssembler = {
  /** @param {Object} r @returns {Subscription} */
  toSubscriptionEntity: (r) => new Subscription({
    id: r.id, hospitalName: r.hospitalName || r.hospital_name || '',
    planId: r.planId || r.plan_id, planName: r.planName || r.plan_name || '',
    status: r.status, startedAt: r.startedAt || r.started_at,
    renewalAt: r.renewalAt || r.renewal_at,
    billingMonthly: r.billingMonthly || r.billing_monthly || 0,
    staffUsed: r.staffUsed || 0, staffLimit: r.staffLimit || r.staff_limit || 50
  }),

  /** @param {Object} r @returns {Plan} */
  toPlanEntity: (r) => new Plan({
    id: r.id, name: r.name, price: r.price || 0, currency: r.currency || 'S/',
    description: r.description || '', maxStaff: r.maxStaff || r.max_staff || 0,
    features: r.features || [], tier: r.tier || 1
  })
}
