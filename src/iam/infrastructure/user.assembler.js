/**
 * @file user.assembler.js
 * @description Assembler que convierte respuestas de la API en entidades User.
 */

import { User } from '../domain/model/user.entity.js'

/**
 * @class UserAssembler
 * @description Transforma objetos de la API REST en instancias de la entidad User.
 */
export class UserAssembler {
  /**
   * Convierte un recurso de API en una entidad User.
   * @param {Object} resource - Objeto plano de la respuesta de la API.
   * @returns {User}
   */
  static toEntity (resource) {
    return new User({
      id:            resource.id            ?? null,
      firstName:     resource.firstName     ?? '',
      lastName:      resource.lastName      ?? '',
      email:         resource.email         ?? '',
      role:          resource.role          ?? '',
      status:        resource.status        ?? '',
      token:         resource.token         ?? '',
      medicalStaffId: resource.medicalStaffId ?? null
    })
  }

  /**
   * Convierte una lista de recursos en entidades User.
   * @param {Object[]} resources
   * @returns {User[]}
   */
  static toEntityList (resources) {
    return resources.map(UserAssembler.toEntity)
  }
}
