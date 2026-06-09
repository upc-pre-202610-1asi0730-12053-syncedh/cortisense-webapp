import { listResource } from '../../shared/infrastructure/api.service.js'
export const auditApi = { logs: params => listResource('auditLogs', params) }
