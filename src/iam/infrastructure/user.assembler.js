import { User } from '../domain/model/user.entity.js'
import { roleToVue } from '../../shared/infrastructure/api.service.js'

export class UserAssembler {
  static toEntity (resource) {
    return new User({
      id: resource?.id ?? null,
      organizationId: resource?.organizationId ?? null,
      firstName: resource?.firstName ?? '',
      lastName: resource?.lastName ?? '',
      email: resource?.email ?? '',
      role: roleToVue(resource?.role ?? ''),
      apiRole: resource?.apiRole ?? resource?.role ?? '',
      status: resource?.status ?? '',
      token: resource?.token ?? '',
      workAreaId: resource?.workAreaId ?? null,
      specialtyId: resource?.specialtyId ?? null
    })
  }

  static toEntityList (resources) {
    return resources.map(UserAssembler.toEntity)
  }
}
