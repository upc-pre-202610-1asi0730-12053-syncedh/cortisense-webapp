/**
 * @file iam.api.js
 * @description Clase de infraestructura para llamadas HTTP del contexto IAM.
 * Maneja autenticación de usuarios.
 */

import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js'

const USERS_PATH = import.meta.env.VITE_USERS_ENDPOINT_PATH

/**
 * @class IamApi
 * @description API de Identity & Access Management.
 * Extiende BaseEndpoint y agrega operaciones específicas de autenticación.
 */
export class IamApi extends BaseEndpoint {
  constructor () {
    super(USERS_PATH)
  }

  /**
   * Autentica un usuario verificando email, password y status=active.
   * Usa GET con query params ya que json-server no tiene auth nativa.
   *
   * @param {import('../domain/commands/login.command.js').LoginCommand} command
   * @returns {Promise<Object>} Objeto de usuario si las credenciales son válidas.
   * @throws {Error} Si no se encuentra ningún usuario con esas credenciales.
   */
  async login (command) {
    const response = await this.getAll({
      email:    command.email,
      password: command.password,
      status:   'active'
    })

    if (!response.data || response.data.length === 0) {
      throw new Error('Invalid credentials')
    }

    return response.data[0]
  }

  /**
   * Obtiene todos los usuarios del sistema.
   * @returns {Promise<Object[]>}
   */
  async getUsers () {
    const response = await this.getAll()
    return response.data
  }

  /**
   * Crea un nuevo usuario en el sistema.
   * @param {Object} payload - Datos del nuevo usuario.
   * @returns {Promise<Object>}
   */
  async createUser (payload) {
    const response = await this.create(payload)
    return response.data
  }

  /**
   * Actualiza los datos de un usuario.
   * @param {string} id
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async updateUser (id, payload) {
    const response = await this.patch(id, payload)
    return response.data
  }

  /**
   * Elimina un usuario por ID.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteUser (id) {
    await this.delete(id)
  }
}

export const iamApi = new IamApi()
