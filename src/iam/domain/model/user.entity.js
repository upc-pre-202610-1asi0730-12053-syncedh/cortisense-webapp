export class User {
  constructor ({ id = null, organizationId = null, firstName = '', lastName = '', email = '', role = '', apiRole = '', status = '', token = '', workAreaId = null, specialtyId = null } = {}) {
    this.id = id
    this.organizationId = organizationId
    this.firstName = firstName
    this.lastName = lastName
    this.email = email
    this.role = role
    this.apiRole = apiRole
    this.status = status
    this.token = token
    this.workAreaId = workAreaId
    this.specialtyId = specialtyId
  }

  get fullName () { return `${this.firstName} ${this.lastName}`.trim() }
  get isActive () { return String(this.status).toUpperCase() === 'ACTIVE' }

  toResource () {
    return {
      id: this.id,
      organizationId: this.organizationId,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      role: this.role,
      apiRole: this.apiRole,
      status: this.status,
      token: this.token,
      workAreaId: this.workAreaId,
      specialtyId: this.specialtyId
    }
  }
}
