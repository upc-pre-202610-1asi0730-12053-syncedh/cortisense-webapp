/**
 * @file recovery.assembler.js
 * @description Ensamblador para staff-recovery.
 */
import { RecoveryPlan } from '../domain/model/recovery-plan.entity.js'

export const RecoveryAssembler = {
  /** @param {Object} r @returns {RecoveryPlan} */
  toEntity: (r) => new RecoveryPlan(r)
}
