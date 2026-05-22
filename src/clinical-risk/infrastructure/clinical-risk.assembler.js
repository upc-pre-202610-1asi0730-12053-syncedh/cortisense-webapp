/**
 * @file clinical-risk.assembler.js
 * @description Ensamblador para clinical-risk.
 */
import { BiometricRecord } from '../domain/model/biometric-record.entity.js'

export const ClinicalRiskAssembler = {
  /** @param {Object} r @returns {BiometricRecord} */
  toBiometricEntity: (r) => new BiometricRecord(r)
}
