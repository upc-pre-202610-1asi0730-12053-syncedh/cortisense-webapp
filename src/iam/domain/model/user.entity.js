/**
 * @file user.entity.js
 * @description Entidad de dominio User para el contexto IAM de CortiSense.
 * Representa a un usuario autenticado con su rol y token de sesión.
 */

/**
 * @class User
 * @description Entidad que modela un usuario del sistema CortiSense.
 * Usa atributos privados de JavaScript (#) para encapsulamiento estricto.
 */
export class User {
  #id
  #firstName
  #lastName
  #email
  #role
  #status
  #token
  #medicalStaffId

  /**
   * @param {Object} data
   * @param {string|null} data.id
   * @param {string} data.firstName
   * @param {string} data.lastName
   * @param {string} data.email
   * @param {string} data.role - 'admin' | 'clinical_supervisor' | 'medical_staff'
   * @param {string} data.status - 'active' | 'inactive'
   * @param {string} data.token
   * @param {string|null} data.medicalStaffId
   */
  constructor ({ id = null, firstName = '', lastName = '', email = '', role = '', status = '', token = '', medicalStaffId = null } = {}) {
    this.#id = id
    this.#firstName = firstName
    this.#lastName = lastName
    this.#email = email
    this.#role = role
    this.#status = status
    this.#token = token
    this.#medicalStaffId = medicalStaffId
  }

  get id () { return this.#id }
  get firstName () { return this.#firstName }
  get lastName () { return this.#lastName }
  get email () { return this.#email }
  get role () { return this.#role }
  get status () { return this.#status }
  get token () { return this.#token }
  get medicalStaffId () { return this.#medicalStaffId }

  /** @returns {string} Nombre completo del usuario. */
  get fullName () { return `${this.#firstName} ${this.#lastName}`.trim() }

  /** @returns {boolean} Indica si el usuario está activo. */
  get isActive () { return this.#status === 'active' }

  /**
   * Serializa la entidad a un objeto plano para persistencia.
   * @returns {Object}
   */
  toResource () {
    return {
      id: this.#id,
      firstName: this.#firstName,
      lastName: this.#lastName,
      email: this.#email,
      role: this.#role,
      status: this.#status,
      token: this.#token,
      medicalStaffId: this.#medicalStaffId
    }
  }
}
