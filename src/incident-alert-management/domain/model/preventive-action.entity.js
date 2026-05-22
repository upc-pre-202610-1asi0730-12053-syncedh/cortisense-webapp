/**
 * @file preventive-action.entity.js
 * @description Entidad de dominio PreventiveAction para incident-alert-management.
 */
export class PreventiveAction {
  #id; #staffId; #alertId; #supervisorId
  #type; #status; #notes; #createdAt

  constructor ({ id=null, staffId=null, alertId=null, supervisorId=null,
    type='rest_recommendation', status='pending', notes='', createdAt=null } = {}) {
    this.#id = id; this.#staffId = staffId; this.#alertId = alertId
    this.#supervisorId = supervisorId; this.#type = type; this.#status = status
    this.#notes = notes; this.#createdAt = createdAt
  }

  get id () { return this.#id }
  get staffId () { return this.#staffId }
  get alertId () { return this.#alertId }
  get supervisorId () { return this.#supervisorId }
  get type () { return this.#type }
  get status () { return this.#status }
  get notes () { return this.#notes }
  get createdAt () { return this.#createdAt }
  get isRestAction () { return ['rest_recommendation','urgent_rest'].includes(this.#type) }

  toResource () {
    return { id: this.#id, staffId: this.#staffId, alertId: this.#alertId,
      supervisorId: this.#supervisorId, type: this.#type, status: this.#status,
      notes: this.#notes, createdAt: this.#createdAt }
  }
}
