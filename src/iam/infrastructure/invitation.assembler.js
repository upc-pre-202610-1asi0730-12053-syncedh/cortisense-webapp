import { Invitation } from '../domain/model/invitation.entity.js'
import { roleToVue } from '../../shared/infrastructure/api.service.js'

export class InvitationAssembler {
  static toEntity(resource) {
    return new Invitation({
      id: resource?.id ?? null,
      organizationId: resource?.organizationId ?? null,
      email: resource?.email ?? '',
      role: roleToVue(resource?.role ?? ''),
      status: resource?.status ?? 'PENDING',
      token: resource?.token ?? '',
      createdAt: resource?.createdAt ?? '',
      acceptedAt: resource?.acceptedAt ?? null,
      cancelledAt: resource?.cancelledAt ?? null,
      expiresAt: resource?.expiresAt ?? null,
      emailStatus: resource?.emailStatus ?? '',
      resendEmailId: resource?.resendEmailId ?? null,
      emailError: resource?.emailError ?? null
    })
  }

  static toEntityList(resources = []) {
    return resources.map(InvitationAssembler.toEntity)
  }
}