import { listResource, createResource, patchResource } from '../../shared/infrastructure/api.service.js'
export const shiftApi = {
  teams: () => listResource('careTeams'),
  members: () => listResource('teamMembers'),
  shifts: params => listResource('shiftRecords', params),
  createTeam: payload => createResource('careTeams', payload),
  createMember: payload => createResource('teamMembers', payload),
  createShift: payload => createResource('shiftRecords', payload),
  patchShift: (id, payload) => patchResource('shiftRecords', id, payload)
}
