/**
 * @file audit.assembler.js
 * @description Ensamblador para audit-compliance.
 */
import { AuditLog } from '../domain/model/audit-log.entity.js'

export const AuditAssembler = {
  /** @param {Object} r @returns {AuditLog} */
  toEntity: (r) => new AuditLog({
    id: r.id, action: r.action, module: r.module,
    userId: r.userId || r.user_id || '',
    staffId: r.staffId || r.staff_id || null,
    details: r.details || r.description || '',
    severity: r.severity || 'info',
    timestamp: r.timestamp,
    ip: r.ip || ''
  })
}
