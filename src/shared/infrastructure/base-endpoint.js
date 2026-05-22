/**
 * @file base-endpoint.js
 * @description Clase base para todos los endpoints de la API de CortiSense.
 * Provee operaciones CRUD reutilizables usando la instancia de Axios.
 */

import { http } from './http.js'

/**
 * @class BaseEndpoint
 * @description Provee métodos HTTP genéricos para interactuar con la API REST.
 * Cada bounded context extiende esta clase para sus propios endpoints.
 */
export class BaseEndpoint {
  /**
   * @param {string} resourcePath - Path del recurso, ej: '/users'
   */
  constructor (resourcePath) {
    this.resourcePath = resourcePath
  }

  /**
   * Obtiene todos los registros del recurso.
   * @param {Object} [params] - Query params opcionales para filtrar.
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getAll (params = {}) {
    return http.get(this.resourcePath, { params })
  }

  /**
   * Obtiene un registro por ID.
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getById (id) {
    return http.get(`${this.resourcePath}/${id}`)
  }

  /**
   * Crea un nuevo registro.
   * @param {Object} payload
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  create (payload) {
    return http.post(this.resourcePath, payload)
  }

  /**
   * Actualiza un registro existente (reemplazo completo).
   * @param {string|number} id
   * @param {Object} payload
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  update (id, payload) {
    return http.put(`${this.resourcePath}/${id}`, payload)
  }

  /**
   * Actualiza parcialmente un registro (PATCH).
   * @param {string|number} id
   * @param {Object} payload
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  patch (id, payload) {
    return http.patch(`${this.resourcePath}/${id}`, payload)
  }

  /**
   * Elimina un registro por ID.
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  delete (id) {
    return http.delete(`${this.resourcePath}/${id}`)
  }
}
