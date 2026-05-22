/**
 * @file invitation.assembler.js
 * @description Assembler que convierte respuestas de la API en entidades Invitation.
 */

import { Invitation } from '../domain/model/invitation.entity.js'

/**
 * @class InvitationAssembler
 * @description Transforma objetos de la API REST en instancias de la entidad Invitation.
 */
export class InvitationAssembler {
  /**
   * Convierte un recurso de API en una entidad Invitation.
   * @param {Object} resource
   * @returns {Invitation}
   */
  static toEntity (resource) {
    return new Invitation({
      id:        resource.id        ?? null,
      email:     resource.email     ?? '',
      role:      resource.role      ?? '',
      status:    resource.status    ?? 'pending',
      createdAt: resource.createdAt ?? ''
    })
  }

  /**
   * Convierte una lista de recursos en entidades Invitation.
   * @param {Object[]} resources
   * @returns {Invitation[]}
   */
  static toEntityList (resources) {
    return resources.map(InvitationAssembler.toEntity)
  }
}
