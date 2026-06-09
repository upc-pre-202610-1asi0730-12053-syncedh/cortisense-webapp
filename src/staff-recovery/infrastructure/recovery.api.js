import { listResource, createResource, patchResource } from '../../shared/infrastructure/api.service.js'
export const recoveryApi = {
  actions: params => listResource('preventiveActions', params),
  createAction: payload => createResource('preventiveActions', payload),
  patchAction: (id, payload) => patchResource('preventiveActions', id, payload)
}
