/**
 * @file incident.assembler.js
 * @description Ensamblador para convertir recursos API a entidades de dominio.
 */
import { Alert } from '../domain/model/alert.entity.js'
import { PreventiveAction } from '../domain/model/preventive-action.entity.js'

export const IncidentAssembler = {
  /** @param {Object} resource @returns {Alert} */
  toAlertEntity: (resource) => new Alert(resource),

  /** @param {Alert} entity @returns {Object} */
  toAlertResource: (entity) => entity.toResource(),

  /** @param {Object} resource @returns {PreventiveAction} */
  toActionEntity: (resource) => new PreventiveAction(resource),

  /** @param {PreventiveAction} entity @returns {Object} */
  toActionResource: (entity) => entity.toResource()
}
