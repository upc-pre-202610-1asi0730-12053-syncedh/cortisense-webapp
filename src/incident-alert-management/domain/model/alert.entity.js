/**
 * @file alert.entity.js
 * @description Entidad de dominio Alert para incident-alert-management.
 */
export class Alert {
  #id; #medicalStaffId; #staffName; #area
  #message; #severity; #status; #createdAt; #type

  constructor ({ id=null, medicalStaffId=null, staffName='', area='',
    message='', severity='low', status='pending', createdAt=null, type='fatigue' } = {}) {
    this.#id = id; this.#medicalStaffId = medicalStaffId; this.#staffName = staffName
    this.#area = area; this.#message = message; this.#severity = severity
    this.#status = status; this.#createdAt = createdAt; this.#type = type
  }

  get id () { return this.#id }
  get medicalStaffId () { return this.#medicalStaffId }
  get staffName () { return this.#staffName }
  get area () { return this.#area }
  get message () { return this.#message }
  get severity () { return this.#severity }
  get status () { return this.#status }
  get createdAt () { return this.#createdAt }
  get type () { return this.#type }
  get isPending () { return this.#status === 'pending' }
  get isCritical () { return this.#severity === 'critical' }

  toResource () {
    return { id: this.#id, medicalStaffId: this.#medicalStaffId, staffName: this.#staffName,
      area: this.#area, message: this.#message, severity: this.#severity,
      status: this.#status, createdAt: this.#createdAt, type: this.#type }
  }
}
