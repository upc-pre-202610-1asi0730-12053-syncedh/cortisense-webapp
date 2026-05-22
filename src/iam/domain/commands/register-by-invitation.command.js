/**
 * @file register-by-invitation.command.js
 * @description Comando de dominio para el registro por invitación.
 * Encapsula los datos necesarios para activar una cuenta invitada.
 */

/**
 * @class RegisterByInvitationCommand
 * @description Objeto de comando para el flujo de registro por invitación.
 * Usa atributos privados de JavaScript (#).
 */
export class RegisterByInvitationCommand {
  #email
  #firstName
  #lastName
  #password
  #workArea
  #specialty

  /**
   * @param {Object} data
   * @param {string} data.email - Correo del invitado (debe coincidir con la invitación).
   * @param {string} data.firstName - Nombre.
   * @param {string} data.lastName - Apellido.
   * @param {string} data.password - Contraseña elegida.
   * @param {string} data.workArea - Área de trabajo hospitalaria.
   * @param {string} data.specialty - Especialidad médica.
   */
  constructor ({ email = '', firstName = '', lastName = '', password = '', workArea = '', specialty = '' } = {}) {
    this.#email = email.trim().toLowerCase()
    this.#firstName = firstName.trim()
    this.#lastName = lastName.trim()
    this.#password = password
    this.#workArea = workArea.trim()
    this.#specialty = specialty.trim()
  }

  get email () { return this.#email }
  get firstName () { return this.#firstName }
  get lastName () { return this.#lastName }
  get password () { return this.#password }
  get workArea () { return this.#workArea }
  get specialty () { return this.#specialty }

  /**
   * Valida que el comando tenga todos los campos obligatorios.
   * @returns {boolean}
   */
  isValid () {
    return (
      this.#email.length > 0 &&
      this.#firstName.length > 0 &&
      this.#lastName.length > 0 &&
      this.#password.length >= 6
    )
  }
}
