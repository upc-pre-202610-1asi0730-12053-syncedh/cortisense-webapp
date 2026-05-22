/**
 * @file login.command.js
 * @description Comando de dominio para el caso de uso de autenticación.
 * Encapsula las credenciales necesarias para iniciar sesión.
 */

/**
 * @class LoginCommand
 * @description Objeto de comando que transporta las credenciales de login.
 * Usa atributos privados de JavaScript (#).
 */
export class LoginCommand {
  #email
  #password

  /**
   * @param {Object} data
   * @param {string} data.email - Correo electrónico del usuario.
   * @param {string} data.password - Contraseña en texto plano.
   */
  constructor ({ email = '', password = '' } = {}) {
    this.#email = email.trim().toLowerCase()
    this.#password = password
  }

  get email () { return this.#email }
  get password () { return this.#password }

  /**
   * Valida que el comando tenga los datos mínimos requeridos.
   * @returns {boolean}
   */
  isValid () {
    return this.#email.length > 0 && this.#password.length > 0
  }
}
