/**
 * @file audit-log.entity.js
 * @description Entidad de dominio AuditLog para audit-compliance.
 */
export class AuditLog {
  #id; #action; #module; #userId; #staffId
  #details; #severity; #timestamp; #ip

  constructor ({ id=null, action='', module='', userId='', staffId=null,
    details='', severity='info', timestamp=null, ip='' } = {}) {
    this.#id = id; this.#action = action; this.#module = module
    this.#userId = userId; this.#staffId = staffId; this.#details = details
    this.#severity = severity; this.#timestamp = timestamp; this.#ip = ip
  }

  get id () { return this.#id }
  get action () { return this.#action }
  get module () { return this.#module }
  get userId () { return this.#userId }
  get staffId () { return this.#staffId }
  get details () { return this.#details }
  get severity () { return this.#severity }
  get timestamp () { return this.#timestamp }
  get ip () { return this.#ip }
  get isCritical () { return this.#severity === 'critical' }

  toResource () {
    return { id: this.#id, action: this.#action, module: this.#module,
      userId: this.#userId, staffId: this.#staffId, details: this.#details,
      severity: this.#severity, timestamp: this.#timestamp, ip: this.#ip }
  }
}
