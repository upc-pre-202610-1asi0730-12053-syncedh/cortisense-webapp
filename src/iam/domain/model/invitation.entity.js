/**
 * @file invitation.entity.js
 * @description Entidad de dominio Invitation para el contexto IAM de CortiSense.
 * Representa una invitación enviada por el administrador a un nuevo usuario.
 */

/**
 * @class Invitation
 * @description Modela una invitación de acceso al sistema.
 * Usa atributos privados de JavaScript (#) para encapsulamiento estricto.
 */
export class Invitation {
  #id
  #email
  #role
  #status
  #createdAt

  /**
   * @param {Object} data
   * @param {string|null} data.id
   * @param {string} data.email
   * @param {string} data.role - 'medical_staff' | 'clinical_supervisor'
   * @param {string} data.status - 'pending' | 'accepted'
   * @param {string} data.createdAt - ISO date string
   */
  constructor ({ id = null, email = '', role = '', status = 'pending', createdAt = '' } = {}) {
    this.#id = id
    this.#email = email
    this.#role = role
    this.#status = status
    this.#createdAt = createdAt
  }

  get id () { return this.#id }
  get email () { return this.#email }
  get role () { return this.#role }
  get status () { return this.#status }
  get createdAt () { return this.#createdAt }

  /** @returns {boolean} Indica si la invitación está pendiente de uso. */
  get isPending () { return this.#status === 'pending' }

  /**
   * Serializa la entidad a un objeto plano.
   * @returns {Object}
   */
  toResource () {
    return {
      id: this.#id,
      email: this.#email,
      role: this.#role,
      status: this.#status,
      createdAt: this.#createdAt
    }
  }
}
