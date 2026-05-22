/**
 * @file recovery-plan.entity.js
 * @description Entidad de dominio RecoveryPlan para staff-recovery.
 */
export class RecoveryPlan {
  #id; #medicalStaffId; #type; #status
  #startDate; #endDate; #recommendations; #triggeredBy; #message

  constructor ({ id=null, medicalStaffId=null, type='rest', status='active',
    startDate=null, endDate=null, recommendations=[], triggeredBy=null, message='' } = {}) {
    this.#id = id; this.#medicalStaffId = medicalStaffId; this.#type = type
    this.#status = status; this.#startDate = startDate; this.#endDate = endDate
    this.#recommendations = recommendations; this.#triggeredBy = triggeredBy; this.#message = message
  }

  get id () { return this.#id }
  get medicalStaffId () { return this.#medicalStaffId }
  get type () { return this.#type }
  get status () { return this.#status }
  get startDate () { return this.#startDate }
  get endDate () { return this.#endDate }
  get recommendations () { return this.#recommendations }
  get triggeredBy () { return this.#triggeredBy }
  get message () { return this.#message }
  get isActive () { return this.#status === 'active' }

  toResource () {
    return { id: this.#id, medicalStaffId: this.#medicalStaffId, type: this.#type,
      status: this.#status, startDate: this.#startDate, endDate: this.#endDate,
      recommendations: this.#recommendations, triggeredBy: this.#triggeredBy, message: this.#message }
  }
}
