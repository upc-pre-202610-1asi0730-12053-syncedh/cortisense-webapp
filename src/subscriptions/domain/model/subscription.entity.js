/**
 * @file subscription.entity.js
 * @description Entidad de dominio Subscription para el contexto subscriptions.
 */
export class Subscription {
  #id; #hospitalName; #planId; #planName; #status
  #startedAt; #renewalAt; #billingMonthly; #staffUsed; #staffLimit

  constructor ({ id=null, hospitalName='', planId=null, planName='', status='',
    startedAt=null, renewalAt=null, billingMonthly=0, staffUsed=0, staffLimit=0 } = {}) {
    this.#id = id; this.#hospitalName = hospitalName; this.#planId = planId
    this.#planName = planName; this.#status = status; this.#startedAt = startedAt
    this.#renewalAt = renewalAt; this.#billingMonthly = billingMonthly
    this.#staffUsed = staffUsed; this.#staffLimit = staffLimit
  }

  get id () { return this.#id }
  get hospitalName () { return this.#hospitalName }
  get planId () { return this.#planId }
  get planName () { return this.#planName }
  get status () { return this.#status }
  get startedAt () { return this.#startedAt }
  get renewalAt () { return this.#renewalAt }
  get billingMonthly () { return this.#billingMonthly }
  get staffUsed () { return this.#staffUsed }
  get staffLimit () { return this.#staffLimit }
  /** @returns {number} Porcentaje de uso del límite de personal */
  get usagePercent () { return this.#staffLimit ? Math.round((this.#staffUsed / this.#staffLimit) * 100) : 0 }

  toResource () {
    return { id: this.#id, hospitalName: this.#hospitalName, planId: this.#planId,
      planName: this.#planName, status: this.#status, startedAt: this.#startedAt,
      renewalAt: this.#renewalAt, billingMonthly: this.#billingMonthly,
      staffUsed: this.#staffUsed, staffLimit: this.#staffLimit }
  }
}
